export const NotificationMessage = {
  // --- Error ---
  NOT_FOUND: "Error.NotificationNotFound",

  // --- Success ---
  // Template: dùng {count} — số thông báo vừa đánh dấu đã đọc.
  MARKED_ALL_READ: "Success.NotificationsMarkedAsRead",
  DELETED: "Success.NotificationDeleted",
} as const;
