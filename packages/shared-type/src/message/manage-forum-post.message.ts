export const ManageForumPostMessage = {
  // --- Service ---
  FORUM_POST_NOT_FOUND: "Error.ForumPostNotFound",
  FORUM_POST_ALREADY_EXISTS: "Error.ForumPostAlreadyExists",

  // --- Validation messages ---
  FORUM_POST_TITLE_REQUIRED: "Error.ForumPostTitleRequired",
  FORUM_POST_CONTENT_REQUIRED: "Error.ForumPostContentRequired",
  
  // --- Internal ---
  INTERNAL_ERROR: "Error.Internal",
  FAILED_TO_LOAD_FORUM_POSTS: "Error.FailedToLoadForumPosts",
} as const;
