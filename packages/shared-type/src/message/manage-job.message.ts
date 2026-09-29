export const ManageJobMessage = {
  BOOKMARK_NOT_FOUND: "Error.BookmarkNotFound",

  JOB_ALREADY_BOOKMARKED: "Error.JobAlreadyBookmarked",

  BOOKMARK_JOB_ONLY_FOR_FREELANCER: "Error.BookmarkJobOnlyForFreelancer",

  JOB_NOT_FOUND: "Error.JobNotFound",

  FAILED_TO_LOAD_BOOKMARKED_JOBS: "Error.FailedToLoadBookmarkedJobs",

  FAILED_TO_BOOKMARK_JOB: "Error.FailedToBookmarkJob",

  FAILED_TO_REMOVE_BOOKMARK: "Error.FailedToRemoveBookmark",

  REMOVE_BOOKMARK_SUCCESS: "Remove bookmark successfully",
  // Common

  // Create Job
  FAILED_TO_CREATE_JOB: "Error.FailedToCreateJob",

  TITLE_REQUIRED: "Error.TitleRequired",
  TITLE_TOO_SHORT: "Error.TitleTooShort",
  TITLE_TOO_LONG: "Error.TitleTooLong",

  DESCRIPTION_TOO_LONG: "Error.DescriptionTooLong",

  BUDGET_MIN_INVALID: "Error.BudgetMinInvalid",
  BUDGET_MAX_INVALID: "Error.BudgetMaxInvalid",
  BUDGET_TYPE_INVALID: "Error.BudgetTypeInvalid",
  BUDGET_MAX_MUST_BE_GREATER_THAN_BUDGET_MIN:
    "Error.BudgetMaxMustBeGreaterThanBudgetMin",

  DEADLINE_INVALID: "Error.DeadlineInvalid",
  DEADLINE_MUST_BE_IN_FUTURE: "Error.DeadlineMustBeInFuture",

  EXPIRY_DATE_INVALID: "Error.ExpiryDateInvalid",
  EXPIRY_DATE_MUST_BE_IN_FUTURE: "Error.ExpiryDateMustBeInFuture",
  EXPIRY_DATE_MUST_BE_BEFORE_DEADLINE: "Error.ExpiryDateMustBeBeforeDeadline",

  SKILLS_REQUIRED: "Error.SkillsRequired",
  SKILL_NAME_REQUIRED: "Error.SkillNameRequired",
  SKILL_NAME_TOO_LONG: "Error.SkillNameTooLong",

  // Edit Job
  FAILED_TO_UPDATE_JOB: "Error.FailedToUpdateJob",

  // Delete Job
  FAILED_TO_DELETE_JOB: "Error.FailedToDeleteJob",

  // Change Status
  FAILED_TO_CHANGE_JOB_STATUS: "Error.FailedToChangeJobStatus",
  JOB_STATUS_INVALID: "Error.JobStatusInvalid",
} as const;
