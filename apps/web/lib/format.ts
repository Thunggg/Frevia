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

/**
 * Convert a Date or ISO string into a YYYY-MM-DD value for HTML date inputs.
 */
export function toDateInputValue(
  value: Date | string | null | undefined,
): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const isUtcMidnight =
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0;
  const year = isUtcMidnight ? date.getUTCFullYear() : date.getFullYear();
  const month = String(
    (isUtcMidnight ? date.getUTCMonth() : date.getMonth()) + 1,
  ).padStart(2, "0");
  const day = String(
    isUtcMidnight ? date.getUTCDate() : date.getDate(),
  ).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert a YYYY-MM-DD HTML date input string into an ISO timestamp at the
 * end of that local calendar day (23:59:59.999).
 */
export function toEndOfDayIso(dateInput: string): string {
  const parts = dateInput.split("-").map(Number);
  const year = parts[0] ?? 1970;
  const month = (parts[1] ?? 1) - 1;
  const day = parts[2] ?? 1;
  return new Date(year, month, day, 23, 59, 59, 999).toISOString();
}

/**
 * Today's date formatted as YYYY-MM-DD in local timezone.
 */
export function getTodayDateInputValue(): string {
  return toDateInputValue(new Date());
}
