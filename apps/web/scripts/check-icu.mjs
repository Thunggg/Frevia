/* eslint-disable no-undef */
/**
 * Kiểm tra cú pháp ICU của toàn bộ message trong từ điển.
 *
 * Vì sao cần: `next build`, `eslint` và `tsc` đều KHÔNG phát hiện được lỗi cú
 * pháp ICU. Một dấu nháy đơn đặt sai chỗ có thể làm `{thamSo}` bị nuốt mất,
 * hoặc một thẻ rich viết sai có thể làm cả câu không render — và những lỗi đó
 * chỉ lộ ra khi người dùng thật nhìn thấy.
 *
 * Script này format mọi message bằng chính formatter của next-intl với tham số
 * giả (số 1 cho biến nội suy, hàm rỗng cho thẻ rich) nên bắt được lỗi sớm.
 *
 * Chạy: pnpm --filter web check-icu
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTranslator } from "next-intl";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const PARAM_RE = /\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*[,}]/g;
const TAG_RE = /<([a-z][a-zA-Z0-9]*)>/g;

function flattenMessages(value, prefix = "", out = []) {
  for (const [key, child] of Object.entries(value)) {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flattenMessages(child, keyPath, out);
    } else {
      out.push([keyPath, String(child)]);
    }
  }
  return out;
}

function namesMatching(source, pattern) {
  const found = new Set();
  for (const match of source.matchAll(pattern)) found.add(match[1]);
  return [...found];
}

let failures = 0;
let checked = 0;

for (const locale of ["en", "vi"]) {
  const catalogPath = path.join(root, "i18n", "messages", `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const t = createTranslator({ locale, messages });

  for (const [key, source] of flattenMessages(messages)) {
    checked += 1;

    const tags = namesMatching(source, TAG_RE);
    const values = {};
    for (const param of namesMatching(source, PARAM_RE)) values[param] = 1;
    for (const tag of tags) {
      values[tag] = (chunks) =>
        Array.isArray(chunks) ? chunks.join("") : String(chunks ?? "");
    }

    try {
      // Message có thẻ rich phải đi qua t.rich, còn lại đi qua t().
      const rendered = tags.length > 0 ? t.rich(key, values) : t(key, values);
      const text = Array.isArray(rendered) ? rendered.join("") : String(rendered);
      if (text.includes("[object") || text.includes("undefined")) {
        throw new Error(`kết quả bất thường: ${text}`);
      }
    } catch (error) {
      failures += 1;
      console.error(`✖ ${locale} ${key}`);
      console.error(`    ${source.slice(0, 110)}`);
      console.error(`    → ${String(error.message).split("\n")[0]}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n✖ ICU: ${failures} message lỗi trên tổng ${checked}`);
  process.exit(1);
}

console.log(`✓ ICU: ${checked} message hợp lệ ở cả en và vi`);
