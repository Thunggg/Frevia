import backendMessagesEn from "./backend/en.json";
import backendMessagesVi from "./backend/vi.json";
import { defaultLocale, type Locale } from "./config";

/**
 * Từ điển thông điệp backend: key là CHÍNH XÁC chuỗi backend gửi về
 * (ví dụ "Error.EmailAlreadyExists" hoặc "Unprocessable Entity"),
 * value là nội dung hiển thị đã bản địa hoá.
 */
const backendMessagesByLocale: Record<Locale, Record<string, string>> = {
  en: backendMessagesEn,
  vi: backendMessagesVi,
};

/**
 * Value trong từ điển được phép chứa placeholder dạng `{tenBien}`; tầng BFF
 * thay bằng giá trị backend gửi kèm (xem `collectParams`).
 */
const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

function interpolate(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(PLACEHOLDER_PATTERN, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/**
 * Gom các field nguyên thuỷ nằm cạnh `message` làm tham số cho template,
 * ví dụ `{ message: "Success.X", count: 3 }` -> `{ count: 3 }`.
 */
function collectParams(
  source: Record<string, unknown>,
): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(source)) {
    if (key === "message") continue;
    if (typeof value === "string" || typeof value === "number") {
      params[key] = value;
    }
  }
  return params;
}

/**
 * Dịch một thông điệp thô của backend sang ngôn ngữ đang chọn.
 * Trả về undefined nếu không có bản dịch, để nơi gọi giữ nguyên bản gốc.
 */
export function translateBackendMessage(
  message: unknown,
  locale: Locale,
  params?: Record<string, string | number>,
): string | undefined {
  if (typeof message !== "string" || message.length === 0) return undefined;

  const template =
    backendMessagesByLocale[locale][message] ??
    backendMessagesByLocale[defaultLocale][message];
  if (template === undefined) return undefined;

  return params ? interpolate(template, params) : template;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function translateDetail(detail: unknown, locale: Locale): unknown {
  // ParseFilePipe mặc định trả `message` dạng string[] -> cần dịch riêng.
  if (typeof detail === "string") {
    return translateBackendMessage(detail, locale) ?? detail;
  }

  if (!isRecord(detail)) return detail;

  const translated = translateBackendMessage(
    detail.message,
    locale,
    collectParams(detail),
  );
  if (translated === undefined) return detail;

  return { ...detail, message: translated };
}

/**
 * Dịch payload lỗi của backend mà không đổi cấu trúc:
 * - `error.message` (cụm HTTP status chung, ví dụ "Unprocessable Entity")
 * - `error.details[]` (mảng { message: key i18n, path }) hoặc `error.details`
 *   dạng chuỗi khi backend ném exception với message đơn.
 *
 * Payload không khớp dạng lỗi được trả về nguyên vẹn.
 */
export function translateBackendErrorPayload(
  payload: unknown,
  locale: Locale,
): unknown {
  if (!isRecord(payload)) return payload;

  const error = payload.error;
  if (!isRecord(error)) return payload;

  const translatedMessage = translateBackendMessage(error.message, locale);

  let translatedDetails: unknown = error.details;
  if (Array.isArray(error.details)) {
    translatedDetails = error.details.map((detail) =>
      translateDetail(detail, locale),
    );
  } else if (typeof error.details === "string") {
    translatedDetails =
      translateBackendMessage(error.details, locale) ?? error.details;
  }

  if (translatedMessage === undefined && translatedDetails === error.details) {
    return payload;
  }

  return {
    ...payload,
    error: {
      ...error,
      ...(translatedMessage === undefined ? {} : { message: translatedMessage }),
      ...(translatedDetails === error.details
        ? {}
        : { details: translatedDetails }),
    },
  };
}

/**
 * Backend trả khoá i18n cho thông báo thành công ở `data.message`
 * (ví dụ "Success.SessionRevoked"), kèm các field nguyên thuỷ làm tham số
 * cho template (`{ count }`, `{ size }`...).
 *
 * CHỈ dịch khi `data.message` có dạng khoá `Error.` / `Success.` / `Fallback.`
 * để không đụng vào `message` là dữ liệu thật (ví dụ nội dung tin nhắn trong
 * hội thoại, hay HTTP status phrase của response lỗi).
 */
const MESSAGE_KEY_PATTERN = /^(?:Error|Success|Fallback)\.\w+$/;

export function translateBackendSuccessPayload(
  payload: unknown,
  locale: Locale,
): unknown {
  if (!isRecord(payload)) return payload;

  const data = payload.data;
  if (!isRecord(data)) return payload;
  if (typeof data.message !== "string") return payload;
  if (!MESSAGE_KEY_PATTERN.test(data.message)) return payload;

  const translated = translateBackendMessage(
    data.message,
    locale,
    collectParams(data),
  );
  if (translated === undefined) return payload;

  return { ...payload, data: { ...data, message: translated } };
}

/**
 * Dịch cả payload lỗi lẫn payload thành công của backend.
 * Dùng ở tầng BFF cho mọi response JSON.
 */
export function translateBackendPayload(
  payload: unknown,
  locale: Locale,
): unknown {
  const localizedError = translateBackendErrorPayload(payload, locale);
  return translateBackendSuccessPayload(localizedError, locale);
}
