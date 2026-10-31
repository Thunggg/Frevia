export const ReportStatus = {
  PENDING: "PENDING",
  REVIEWED: "REVIEWED",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
} as const;

export const ReportStatusArray = Object.values(ReportStatus);

export type ReportStatusType = (typeof ReportStatusArray)[number];
