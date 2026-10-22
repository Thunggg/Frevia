"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { translateBackendMessage } from "@/i18n/backend-message";
import { defaultLocale, isLocale, type Locale } from "@/i18n/config";

/**
 * Dịch một thông điệp backend (key i18n) ngay trong client component.
 *
 * Cần dùng cho những lỗi được set thủ công qua `form.setError` — các lỗi này
 * không đi qua proxy BFF và cũng không đi qua `useTranslatedResolver`, nên nếu
 * không dịch sẽ hiển thị key thô (ví dụ "Error.ProposalDraftContentRequired").
 */
export function useBackendMessage() {
  const activeLocale = useLocale();
  const locale: Locale = isLocale(activeLocale) ? activeLocale : defaultLocale;

  return useCallback(
    (message: string) => translateBackendMessage(message, locale) ?? message,
    [locale],
  );
}
