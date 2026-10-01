export const BrowseJobMessage = {
  // =========================
  // Common
  // =========================
  JOB_NOT_FOUND: "Error.JobNotFound",

  INVALID_PAGE: "Error.InvalidPage",
  INVALID_LIMIT: "Error.InvalidLimit",

  INTERNAL_ERROR: "Error.Internal",

  // =========================
  // View Job List
  // =========================
  FAILED_TO_LOAD_JOB_LIST: "Error.FailedToLoadJobList",

  // =========================
  // View Job Detail
  // =========================
  FAILED_TO_LOAD_JOB_DETAIL: "Error.FailedToLoadJobDetail",
} as const;
