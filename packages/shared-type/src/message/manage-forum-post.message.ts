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
  FAILED_TO_CREATE_FORUM_POST: "Error.FailedToCreateForumPost",
  FAILED_TO_VIEW_FORUM_POST: "Error.FailedToViewForumPost",
  FAILED_TO_UPDATE_FORUM_POST: "Error.FailedToUpdateForumPost",
  FAILED_TO_DELETE_FORUM_POST: "Error.FailedToDeleteForumPost",
  FORUM_POST_NOT_OWNED: "Error.ForumPostNotOwned",
} as const;
