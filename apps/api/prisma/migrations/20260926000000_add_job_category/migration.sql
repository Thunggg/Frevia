-- Job Category (UC-46): Admin quản lý danh mục công việc.
-- 1) Enum JobCategoryStatus (ACTIVE / INACTIVE) — vô hiệu hoá không cần xoá
-- 2) Bảng JobCategory — soft delete qua "deletedAt" + partial unique index
-- 3) Job.categoryId (nullable, ON DELETE SET NULL) — job cũ giữ NULL

-- CreateEnum
CREATE TYPE "JobCategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "JobCategory" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "status" "JobCategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- AlterTable: gắn danh mục vào Job (nullable để không phá dữ liệu job đang có)
ALTER TABLE "Job" ADD COLUMN "categoryId" INTEGER;

-- CreateIndex
CREATE INDEX "JobCategory_deletedAt_idx" ON "JobCategory"("deletedAt");
CREATE INDEX "JobCategory_status_deletedAt_idx" ON "JobCategory"("status", "deletedAt");
CREATE INDEX "Job_categoryId_idx" ON "Job"("categoryId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JobCategory"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- Partial unique index (Prisma không hỗ trợ): chỉ ràng buộc danh mục chưa bị xoá.
-- "name" so sánh bằng LOWER() để khớp kiểm tra trùng tên không phân biệt hoa/thường ở tầng service.
CREATE UNIQUE INDEX "idx_job_categories_name_active" ON "JobCategory" (LOWER("name")) WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX "idx_job_categories_slug_active" ON "JobCategory" ("slug") WHERE "deletedAt" IS NULL;
