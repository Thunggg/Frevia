-- Thêm loại thông báo cho bình luận / lượt thích bài viết diễn đàn
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POST_COMMENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'POST_LIKE';
