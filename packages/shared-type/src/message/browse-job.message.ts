export const BrowseJobMessage = {
  JOB_NOT_FOUND: "Error.JobNotFound",
  INVALID_PAGE: "Error.InvalidPage",
  INVALID_LIMIT: "Error.InvalidLimit",
  INTERNAL_ERROR: "Error.Internal",

  FAILED_TO_LOAD_JOB_LIST: "Error.FailedToLoadJobList",
  FAILED_TO_LOAD_JOB_DETAIL: "Error.FailedToLoadJobDetail",

  FAILED_TO_LOAD_BOOKMARKED_JOBS: "Error.FailedToLoadBookmarkedJobs",

  FAILED_TO_BOOKMARK_JOB: "Error.FailedToBookmarkJob",

  FAILED_TO_REMOVE_BOOKMARK: "Error.FailedToRemoveBookmark",
  JOB_ALREADY_BOOKMARKED: "Job already bookmarked",
} as const;
