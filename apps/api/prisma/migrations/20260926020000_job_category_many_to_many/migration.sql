-- UC-46: chuyển quan hệ Job <-> JobCategory từ 1-n (Job.categoryId) sang N-N
-- qua bảng trung gian "JobJobCategory" (theo pattern "JobSkill").
-- Thứ tự bắt buộc: tạo bảng trung gian -> backfill dữ liệu cũ -> mới bỏ cột 1-n.

-- CreateTable
CREATE TABLE "JobJobCategory" (
    "jobId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "JobJobCategory_pkey" PRIMARY KEY ("jobId","categoryId")
);

-- Backfill: mỗi job đang gắn 1 danh mục trở thành 1 dòng liên kết
INSERT INTO "JobJobCategory" ("jobId", "categoryId")
SELECT "id", "categoryId"
FROM "Job"
WHERE "categoryId" IS NOT NULL
ON CONFLICT DO NOTHING;

-- CreateIndex
CREATE INDEX "JobJobCategory_categoryId_idx" ON "JobJobCategory"("categoryId");

-- AddForeignKey
ALTER TABLE "JobJobCategory" ADD CONSTRAINT "JobJobCategory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "JobJobCategory" ADD CONSTRAINT "JobJobCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JobCategory"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- DropForeignKey (quan hệ 1-n cũ)
ALTER TABLE "Job" DROP CONSTRAINT "Job_categoryId_fkey";

-- DropIndex
DROP INDEX "Job_categoryId_idx";

-- DropColumn
ALTER TABLE "Job" DROP COLUMN "categoryId";
