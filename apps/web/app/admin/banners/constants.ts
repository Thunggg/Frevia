import type { BannerPosition } from "@shared/types";

export const BANNER_POSITIONS: { value: BannerPosition; label: string }[] = [
  { value: "GLOBAL_HEADER", label: "Global Header Strip" },
  { value: "HOME_HERO", label: "Homepage Hero" },
  { value: "HOME_BODY", label: "Homepage Body" },
  { value: "SEARCH_RESULTS", label: "Search Results" },
  { value: "FOOTER", label: "Above Footer" },
];

export function bannerPositionLabel(position: BannerPosition): string {
  return (
    BANNER_POSITIONS.find((item) => item.value === position)?.label ?? position
  );
}