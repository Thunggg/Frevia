/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
/**
 * Kiểm tra từ điển i18n của apps/web:
 *  1. JSON hợp lệ
 *  2. Không có key trùng trong cùng một object (JSON.parse nuốt lặng key trùng,
 *     nên phải tự dò)
 *  3. en và vi có đúng cùng tập key — thiếu key sẽ khiến next-intl fallback
 *     hoặc lỗi runtime ở ngôn ngữ đó
 *
 * Chạy: pnpm --filter web check-i18n
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      let j = i + 1;
      let str = "";
      while (j < text.length) {
        if (text[j] === "\\") {
          str += text[j] + text[j + 1];
          j += 2;
          continue;
        }
        if (text[j] === '"') break;
        str += text[j];
        j++;
      }
      tokens.push({ type: "string", value: str });
      i = j + 1;
      continue;
    }
    if ("{}[]:,".includes(ch)) {
      tokens.push({ type: ch });
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}

function findDuplicateKeys(text) {
  const tokens = tokenize(text);
  const duplicates = [];
  const stack = [];
  let pendingKey = null;

  for (let k = 0; k < tokens.length; k++) {
    const token = tokens[k];

    if (token.type === "string") {
      const next = tokens[k + 1];
      if (next && next.type === ":") pendingKey = token.value;
      continue;
    }

    if (token.type === ":") {
      const frame = stack[stack.length - 1];
      if (frame && frame.type === "object" && pendingKey !== null) {
        if (frame.keys.has(pendingKey)) {
          duplicates.push([...frame.path, pendingKey].join("."));
        }
        frame.keys.add(pendingKey);
      }
      continue;
    }

    if (token.type === "{") {
      const frame = stack[stack.length - 1];
      const parentPath = frame ? frame.path : [];
      stack.push({
        type: "object",
        keys: new Set(),
        path: pendingKey !== null ? [...parentPath, pendingKey] : parentPath,
      });
      pendingKey = null;
      continue;
    }

    if (token.type === "[") {
      stack.push({ type: "array", keys: new Set(), path: [] });
      pendingKey = null;
      continue;
    }

    if (token.type === "}" || token.type === "]") {
      stack.pop();
      pendingKey = null;
    }
  }

  return duplicates;
}

function flattenKeys(value, prefix = "") {
  const keys = [];
  for (const [key, child] of Object.entries(value)) {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      keys.push(...flattenKeys(child, keyPath));
    } else {
      keys.push(keyPath);
    }
  }
  return keys;
}

let hasError = false;

function checkPair(label, enRelative, viRelative) {
  const enPath = path.join(root, enRelative);
  const viPath = path.join(root, viRelative);
  const enText = fs.readFileSync(enPath, "utf8");
  const viText = fs.readFileSync(viPath, "utf8");

  for (const [locale, text] of [
    ["en", enText],
    ["vi", viText],
  ]) {
    const duplicates = findDuplicateKeys(text);
    if (duplicates.length) {
      hasError = true;
      console.error(
        `✖ ${label} (${locale}): key trùng → ${duplicates.join(", ")}`,
      );
    }
  }

  const enKeys = new Set(flattenKeys(JSON.parse(enText)));
  const viKeys = new Set(flattenKeys(JSON.parse(viText)));
  const missingInVi = [...enKeys].filter((key) => !viKeys.has(key));
  const missingInEn = [...viKeys].filter((key) => !enKeys.has(key));

  if (missingInVi.length) {
    hasError = true;
    console.error(`✖ ${label}: thiếu ở vi → ${missingInVi.join(", ")}`);
  }
  if (missingInEn.length) {
    hasError = true;
    console.error(`✖ ${label}: thiếu ở en → ${missingInEn.join(", ")}`);
  }

  if (!missingInVi.length && !missingInEn.length) {
    console.log(`✓ ${label}: ${enKeys.size} key, en/vi khớp nhau`);
  }
}

/**
 * Thông báo hệ thống được dịch theo `NotificationType` (xem
 * hooks/use-notification-text.ts) chứ không đọc cột `title`/`message` backend
 * đã lưu. Allowlist trong hook phải khớp từ điển, nếu lệch thì next-intl sẽ
 * ném lỗi ngay lúc chạy — nên chặn từ đây.
 */
function checkNotificationText() {
  const source = fs.readFileSync(
    path.join(root, "hooks/use-notification-text.ts"),
    "utf8",
  );

  const readStringList = (name) => {
    const match = source.match(
      new RegExp(`${name}\\s*=\\s*\\[([^\\]]*)\\]`, "s"),
    );
    return match ? [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : null;
  };

  const types = readStringList("TRANSLATABLE_NOTIFICATION_TYPES");
  const kinds = readStringList("TRANSLATABLE_NOTIFICATION_KINDS");
  if (!types || !kinds) {
    hasError = true;
    console.error(
      "✖ notificationText: không đọc được allowlist trong hooks/use-notification-text.ts",
    );
    return;
  }

  const conditionalKeys = [
    ...source.matchAll(/([A-Z][A-Z_]+):\s*\{\s*param:/g),
  ].map((match) => match[1]);

  const catalogs = {
    en: JSON.parse(
      fs.readFileSync(path.join(root, "i18n/messages/en.json"), "utf8"),
    ),
    vi: JSON.parse(
      fs.readFileSync(path.join(root, "i18n/messages/vi.json"), "utf8"),
    ),
  };

  const missing = [];
  for (const key of [...types, ...kinds]) {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      const entry = catalog.notificationText && catalog.notificationText[key];
      if (!entry) {
        missing.push(`${locale} notificationText.${key}`);
        continue;
      }
      for (const field of ["title", "message"]) {
        if (typeof entry[field] !== "string") {
          missing.push(`${locale} notificationText.${key}.${field}`);
        }
      }
    }
    if (conditionalKeys.includes(key)) {
      for (const [locale, catalog] of Object.entries(catalogs)) {
        const entry = catalog.notificationText && catalog.notificationText[key];
        if (!entry || typeof entry.messageWithReason !== "string") {
          missing.push(`${locale} notificationText.${key}.messageWithReason`);
        }
      }
    }
  }

  if (missing.length) {
    hasError = true;
    console.error(`✖ notificationText: thiếu key → ${missing.join(", ")}`);
    return;
  }

  console.log(
    `✓ notificationText: ${types.length + kinds.length} loại thông báo khớp allowlist`,
  );
}

checkPair(
  "UI messages",
  "i18n/messages/en.json",
  "i18n/messages/vi.json",
);
checkPair(
  "Backend messages",
  "i18n/backend/en.json",
  "i18n/backend/vi.json",
);
checkNotificationText();

if (hasError) process.exit(1);
