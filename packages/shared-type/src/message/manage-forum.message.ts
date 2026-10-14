export const ManageForumMessage = {
  // --- Service ---
  FORUM_CATEGORY_NOT_FOUND: "Error.ForumCategoryNotFound",
  FORUM_CATEGORY_ALREADY_EXISTS: "Error.ForumCategoryAlreadyExists",

  // --- Validation messages ---
  FORUM_CATEGORY_NAME_REQUIRED: "Error.ForumCategoryNameRequired",
  FORUM_CATEGORY_NAME_TOO_LONG: "Error.ForumCategoryNameTooLong",
  FORUM_CATEGORY_DESCRIPTION_TOO_LONG: "Error.ForumCategoryDescriptionTooLong",

  FORUM_CATEGORY_HAS_POSTS: "Error.ForumCategoryHasPosts",
  FAILED_TO_DELETE_FORUM_CATEGORY: "Error.FailedToDeleteForumCategory",

  // --- Internal ---
  INTERNAL_ERROR: "Error.Internal",
  FAILED_TO_LOAD_FORUM_CATEGORIES: "Error.FailedToLoadForumCategories",
} as const;
