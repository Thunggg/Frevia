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
 * Dịch một thông điệp thô của backend sang ngôn ngữ đang chọn.
 * Trả về undefined nếu không có bản dịch, để nơi gọi giữ nguyên bản gốc.
 */
export function translateBackendMessage(
  message: unknown,
  locale: Locale,
): string | undefined {
  if (typeof message !== "string" || message.length === 0) return undefined;

  return (
    backendMessagesByLocale[locale][message] ??
    backendMessagesByLocale[defaultLocale][message]
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function translateDetail(detail: unknown, locale: Locale): unknown {
  if (!isRecord(detail)) return detail;

  const translated = translateBackendMessage(detail.message, locale);
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
