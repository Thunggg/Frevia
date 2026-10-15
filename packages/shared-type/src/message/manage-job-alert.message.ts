export const ManageJobAlertMessage = {
  FREELANCER_ONLY: "Error.JobAlertOnlyForFreelancer",
  FAILED_TO_CREATE: "Error.FailedToCreateJobAlert",
  FAILED_TO_UPDATE: "Error.FailedToUpdateJobAlert",
  FAILED_TO_LOAD: "Error.FailedToLoadJobAlerts",
  FAILED_TO_LOAD_DETAIL: "Error.FailedToLoadJobAlertDetail",
  NOT_FOUND: "Error.JobAlertNotFound",
  SKILL_NOT_FOUND: "Error.SkillNotFound",

  INVALID_PAGE: "Error.InvalidPage",
  INVALID_LIMIT: "Error.InvalidLimit",

  NAME_REQUIRED: "Error.JobAlertNameRequired",
  NAME_TOO_LONG: "Error.JobAlertNameTooLong",
  KEYWORDS_TOO_LONG: "Error.JobAlertKeywordsTooLong",
  BUDGET_MIN_INVALID: "Error.BudgetMinInvalid",
  BUDGET_MAX_INVALID: "Error.BudgetMaxInvalid",
  BUDGET_RANGE_INVALID: "Error.BudgetMaxMustBeGreaterThanBudgetMin",
  FREQUENCY_INVALID: "Error.JobAlertFrequencyInvalid",
  CHANNEL_INVALID: "Error.JobAlertChannelInvalid",
  CHANNELS_REQUIRED: "Error.JobAlertChannelsRequired",
  SKILL_INVALID: "Error.SkillIdInvalid",
  NO_FIELDS_TO_UPDATE: "Error.NoFieldsToUpdate",
} as const;
