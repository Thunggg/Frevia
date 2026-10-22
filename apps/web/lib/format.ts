/**
 * Locale-aware formatting helpers for the admin panel.
 *
 * Use these instead of hard-coding "en-US" or calling toLocaleString()
 * without a locale argument.
 *
 * In Client Components, call useFormatter() and useLocale() from next-intl,
 * then pass the locale through. In Server Components, pass the locale from
 * cookies/headers or use the helpers that accept a locale argument.
 *
 * Quick usage:
 *   import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
 *   // In a client component:
 *   const locale = useLocale();
 *   formatDate(banner.createdAt, locale);
 */

/**
 * Format a date value to locale-aware short date string.
 * Falls back to "—" when value is null / undefined.
 */
export function formatDate(
  value: Date | string | null | undefined,
  locale: string,
): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

/**
 * Format a date value to locale-aware datetime string.
 * Falls back to "—" when value is null / undefined.
 */
export function formatDateTime(
  value: Date | string | null | undefined,
  locale: string,
): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/**
 * Format a number with locale-aware thousands separators.
 */
export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a number with compact notation (e.g. 1.2K, 3.4M).
 */
export function formatCompact(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Format a monetary amount as localized currency.
 * Falls back to zero when value is null / undefined / unparsable.
 */
export function formatCurrency(
  value: number | string | null | undefined,
  locale: string,
  currency = "USD",
  maximumFractionDigits = 2,
): string {
  if (value === null || value === undefined) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits,
    }).format(0);
  }
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(Number.isNaN(num) ? 0 : num);
}
