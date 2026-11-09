-- AlterTable: Add moderation fields to ForumComment
-- Dùng chung enum "ForumPostStatus" (PENDING, APPROVED, REJECTED) với ForumPost
ALTER TABLE "ForumComment"
  ADD COLUMN "moderationStatus" "ForumPostStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "moderationScore" DOUBLE PRECISION,
  ADD COLUMN "moderationCategories" JSONB,
  ADD COLUMN "reviewedById" INTEGER,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- Backfill: bình luận đã có (trước khi có kiểm duyệt) xem như đã được duyệt
-- để nội dung forum hiện tại vẫn hiển thị công khai
UPDATE "ForumComment" SET "moderationStatus" = 'APPROVED' WHERE "deletedAt" IS NULL;

-- Foreign key: reviewedBy admin
ALTER TABLE "ForumComment"
  ADD CONSTRAINT "ForumComment_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- CreateIndexes
CREATE INDEX "ForumComment_moderationStatus_idx" ON "ForumComment"("moderationStatus");
CREATE INDEX "ForumComment_reviewedById_idx" ON "ForumComment"("reviewedById");
