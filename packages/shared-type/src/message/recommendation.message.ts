export const RecommendationMessage = {
  // =========================
  // Common
  // =========================
  JOB_NOT_FOUND: "Error.JobNotFound",
  FREELANCER_PROFILE_NOT_FOUND: "Error.Recommendation.FreelancerProfileNotFound",
  ROLE_NOT_ALLOWED: "Error.Recommendation.RoleNotAllowed",

  // =========================
  // Load recommendations
  // =========================
  FAILED_TO_LOAD_RECOMMENDATIONS:
    "Error.Recommendation.FailedToLoadRecommendations",
  AI_SERVICE_UNAVAILABLE: "Error.Recommendation.AiServiceUnavailable",

  // =========================
  // Explanation
  // =========================
  RECOMMENDATION_NOT_FOUND: "Error.Recommendation.NotFound",
  RECOMMENDATION_FORBIDDEN: "Error.Recommendation.Forbidden",
  FAILED_TO_LOAD_EXPLANATION: "Error.Recommendation.FailedToLoadExplanation",

  // =========================
  // Feedback
  // =========================
  FAILED_TO_SUBMIT_FEEDBACK: "Error.Recommendation.FailedToSubmitFeedback",

  // =========================
  // Reindex (vận hành §16)
  // =========================
  REINDEX_FORBIDDEN: "Error.Recommendation.ReindexForbidden",
  FAILED_TO_REINDEX: "Error.Recommendation.FailedToReindex",

  // =========================
  // Outbox (đồng bộ index §6.3)
  // =========================
  OUTBOX_PROCESS_FORBIDDEN: "Error.Recommendation.OutboxProcessForbidden",
  FAILED_TO_PROCESS_OUTBOX: "Error.Recommendation.FailedToProcessOutbox",
} as const;
