import {
  ProfileUpdateStatus,
  type ProfileUpdateStatusType,
} from "@shared/types";

const profileUpdateFallbackText: Record<ProfileUpdateStatusType, string> = {
  [ProfileUpdateStatus.APPLIED]: "Profile updated successfully.",
  [ProfileUpdateStatus.PENDING_REVIEW]:
    "Changes submitted for administrator review.",
};

/**
 * Keeps API responses language-neutral. Replace this fallback lookup with the
 * application's translation function when locale dictionaries are introduced.
 */
export function getProfileUpdateText(status: ProfileUpdateStatusType) {
  return profileUpdateFallbackText[status];
}
