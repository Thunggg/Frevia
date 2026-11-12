import {
  getPermissionDescriptor,
  getPermissionFallbackName,
} from "@shared/types";

export interface PermissionLike {
  id?: number;
  method: string;
  path: string;
  name?: string | null;
  module?: string | null;
}

/**
 * Returns a user-friendly, localized display name for a permission.
 * Prioritizes explicitly mapped business names (in Vietnamese or English),
 * falling back to custom DB names (if any, excluding raw method+path strings)
 * and then to rule-based fallback generators.
 */
export function getPermissionDisplayName(
  permission: PermissionLike,
  locale: string = "vi",
): string {
  const normMethod = (permission.method || "").toUpperCase();
  const rawName = permission.name?.trim() ?? "";

  // Check if we have an explicit descriptor in PERMISSION_MAP
  const descriptor = getPermissionDescriptor(normMethod, permission.path);
  if (descriptor) {
    return locale === "vi" ? descriptor.vi : descriptor.en;
  }

  // If DB name is present and is NOT just raw method + path
  const isRawMethodPath =
    rawName === `${normMethod} ${permission.path}` ||
    rawName.startsWith(`${normMethod} /`);
  if (rawName && !isRawMethodPath) {
    return rawName;
  }

  // Dynamic fallback
  return getPermissionFallbackName(normMethod, permission.path, locale);
}

