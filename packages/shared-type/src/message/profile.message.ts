export const ProfileMessage = {
  PROFILE_NOT_FOUND: "Freelancer profile not found.",
  PROFILE_FORBIDDEN: "You can only update your own profile.",
  DISPLAY_NAME_REQUIRED: "Display name is required.",
  TITLE_REQUIRED: "Title is required.",
  FAILED_TO_LOAD_PROFILE: "Failed to load freelancer profile.",
  FAILED_TO_UPDATE_PROFILE: "Failed to update freelancer profile.",
  SKILLS_NOT_FOUND: "No skills added yet.",
  SKILL_NAME_REQUIRED: "Skill name is required.",
  PROFICIENCY_LEVEL_REQUIRED: "Proficiency level is required.",
  PROFICIENCY_LEVEL_RANGE: "Proficiency level must be between 1 and 10.",
  DUPLICATE_SKILL: "This skill has already been added to your profile.",
  SKILL_NOT_FOUND: "Skill not found or already deleted.",
  SKILL_DELETE_FORBIDDEN: "You can only delete your own skills.",
  PROFILE_UPDATED: "Success.ProfileUpdated",
  PROFILE_REVISION_SUBMITTED: "Success.ProfileRevisionSubmitted",
  CV_ANALYSIS_NOT_FOUND: "CV analysis draft not found.",
  CV_ANALYSIS_NOT_PENDING:
    "This CV analysis has already been confirmed or discarded.",
  CV_ANALYSIS_STALE:
    "This analysis is outdated because the CV has changed. Please analyze the CV again.",
  CV_ANALYSIS_CONFIRMED: "Success.CvAnalysisConfirmed",
  CV_ANALYSIS_DISCARDED: "Success.CvAnalysisDiscarded",
} as const;
