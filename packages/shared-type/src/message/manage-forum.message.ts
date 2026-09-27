export const ManageForumMessage = {
  // --- Service ---
  FORUM_CATEGORY_NOT_FOUND: "Error.ForumCategoryNotFound",
  FORUM_CATEGORY_ALREADY_EXISTS: "Error.ForumCategoryAlreadyExists",

  // --- Validation messages ---
  FORUM_CATEGORY_NAME_REQUIRED: "Error.ForumCategoryNameRequired",
  FORUM_CATEGORY_NAME_TOO_LONG: "Error.ForumCategoryNameTooLong",
  FORUM_CATEGORY_DESCRIPTION_TOO_LONG: "Error.ForumCategoryDescriptionTooLong",

  // --- Internal ---
  INTERNAL_ERROR: "Error.Internal",
  FAILED_TO_LOAD_FORUM_CATEGORIES: "Error.FailedToLoadForumCategories",
} as const;
