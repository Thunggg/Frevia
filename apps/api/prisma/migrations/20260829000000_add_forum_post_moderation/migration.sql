-- AlterTable: Add moderation fields to ForumPost
-- Chỉ có 3 trạng thái kiểm duyệt: PENDING, APPROVED, REJECTED
CREATE TYPE "ForumPostStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "ForumPost"
  ADD COLUMN "moderationStatus" "ForumPostStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "moderationScore" DOUBLE PRECISION,
  ADD COLUMN "moderationCategories" JSONB,
  ADD COLUMN "reviewedById" INTEGER,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

-- Backfill: bài viết đã có (trước khi có kiểm duyệt) xem như đã được duyệt
-- để nội dung forum hiện tại vẫn hiển thị công khai
UPDATE "ForumPost" SET "moderationStatus" = 'APPROVED' WHERE "deletedAt" IS NULL;

-- Foreign key: reviewedBy admin
ALTER TABLE "ForumPost"
  ADD CONSTRAINT "ForumPost_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

-- CreateIndexes
CREATE INDEX "ForumPost_moderationStatus_idx" ON "ForumPost"("moderationStatus");
CREATE INDEX "ForumPost_reviewedById_idx" ON "ForumPost"("reviewedById");