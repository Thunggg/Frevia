import type { BannerPosition } from "@shared/types";

/**
 * Nhãn tiếng Anh cho vị trí banner KHÔNG được dùng để render trực tiếp —
 * luôn gọi `bannerPositionLabel(position, t)` để lấy nhãn đã dịch.
 */
export const BANNER_POSITIONS: {
  value: BannerPosition;
  labelKey: string;
}[] = [
  { value: "GLOBAL_HEADER", labelKey: "globalHeader" },
  { value: "HOME_HERO", labelKey: "homeHero" },
  { value: "HOME_BODY", labelKey: "homeBody" },
  { value: "SEARCH_RESULTS", labelKey: "searchResults" },
  { value: "FOOTER", labelKey: "aboveFooter" },
];

export function bannerPositionLabel(
  position: BannerPosition,
  t: (key: string) => string,
): string {
  const found = BANNER_POSITIONS.find((item) => item.value === position);
  return found ? t(`positions.${found.labelKey}`) : position;
}
