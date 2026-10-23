export const ReviewMessage = {
  // --- Error ---
  CONTRACT_NOT_FOUND: "Error.ReviewContractNotFound",
  CONTRACT_NOT_COMPLETED: "Error.ReviewContractNotCompleted",
  NOT_FOUND: "Error.ReviewNotFound",
  RESPONSE_NOT_FOUND: "Error.ReviewResponseNotFound",
  FORBIDDEN: "Error.ReviewForbidden",
  ALREADY_EXISTS: "Error.ReviewAlreadyExists",
  RESPONSE_ALREADY_EXISTS: "Error.ReviewResponseAlreadyExists",

  // --- Success ---
  DELETED: "Success.ReviewDeleted",
  RESPONSE_DELETED: "Success.ReviewResponseDeleted",

  // --- Fallback ---
  // Ghi vào DB (review/notification) khi tài khoản không còn display name.
  CONTRACT_PARTICIPANT: "Fallback.ContractParticipant",
} as const;
