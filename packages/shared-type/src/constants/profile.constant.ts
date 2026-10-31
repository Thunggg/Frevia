export const AvailabilityStatus = {
  AVAILABLE: "AVAILABLE",
  BUSY: "BUSY",
  AWAY: "AWAY",
  OFFLINE: "OFFLINE",
} as const;

export type AvailabilityStatusType =
  (typeof AvailabilityStatus)[keyof typeof AvailabilityStatus];

export const REQUEST_USER_KEY = "user";
