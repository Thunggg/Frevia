export const ManageJobAlertMessage = {
  NOT_FOUND: 'Error.JobAlertNotFound',
  FAILED_TO_CREATE: 'Error.FailedToCreateJobAlert',
  FAILED_TO_LOAD: 'Error.FailedToLoadJobAlert',
  FAILED_TO_UPDATE: 'Error.FailedToUpdateJobAlert',
  FAILED_TO_DELETE: 'Error.FailedToDeleteJobAlert',
  ONLY_FOR_FREELANCER: 'Error.JobAlertOnlyForFreelancer',
  KEYWORD_OR_SKILL_REQUIRED: 'Error.JobAlertKeywordOrSkillRequired',
  LIMIT_EXCEEDED: 'Error.JobAlertLimitExceeded',
  DUPLICATE_CRITERIA: 'Error.JobAlertDuplicateCriteria',
} as const;

export const MAX_JOB_ALERTS_PER_USER = 10;
