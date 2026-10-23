-- Job hiring fields + proposal status lifecycle.
--
-- 1) Job: hiringType (SINGLE/MULTIPLE), positionsRequired, positionsFilled.
-- 2) ProposalStatus: PENDING -> SUBMITTED, ACCEPTED -> HIRED, thêm INTERVIEWING và EXPIRED.
--    `RENAME VALUE` đổi tên tại chỗ nên dữ liệu cũ giữ nguyên ý nghĩa.
-- 3) Proposal.expiresAt: hạn xử lý của đề xuất đang chờ khách hàng (mặc định 30 ngày).
-- 4) Contract.jobId: bỏ unique để một job tuyển nhiều người có nhiều hợp đồng.

-- CreateEnum
CREATE TYPE "HiringType" AS ENUM ('SINGLE', 'MULTIPLE');

-- AlterTable: Job
ALTER TABLE "Job" ADD COLUMN "hiringType" "HiringType" NOT NULL DEFAULT 'SINGLE';
ALTER TABLE "Job" ADD COLUMN "positionsRequired" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Job" ADD COLUMN "positionsFilled" INTEGER NOT NULL DEFAULT 0;

-- AlterEnum: ProposalStatus
ALTER TYPE "ProposalStatus" RENAME VALUE 'PENDING' TO 'SUBMITTED';
ALTER TYPE "ProposalStatus" RENAME VALUE 'ACCEPTED' TO 'HIRED';
ALTER TYPE "ProposalStatus" ADD VALUE 'INTERVIEWING';
ALTER TYPE "ProposalStatus" ADD VALUE 'EXPIRED';

-- AlterTable: Proposal
ALTER TABLE "Proposal" ADD COLUMN "expiresAt" TIMESTAMP(3);

-- Backfill: đề xuất đang chờ/đang phỏng vấn có hạn 30 ngày kể từ lúc gửi.
UPDATE "Proposal"
SET "expiresAt" = "submittedAt" + INTERVAL '30 days'
WHERE "submittedAt" IS NOT NULL
  AND "deletedAt" IS NULL
  AND "status" IN ('SUBMITTED', 'INTERVIEWING');

-- Backfill: số vị trí đã tuyển phải khớp số đề xuất đã HIRED của job.
UPDATE "Job" j
SET "positionsFilled" = (
  SELECT COUNT(*)
  FROM "Proposal" p
  WHERE p."jobId" = j."id"
    AND p."deletedAt" IS NULL
    AND p."status" = 'HIRED'
);

-- Job tuyển nhiều người: số vị trí không được nhỏ hơn số đã tuyển.
UPDATE "Job"
SET "positionsRequired" = "positionsFilled"
WHERE "positionsRequired" < "positionsFilled";

-- DropIndex (quan hệ 1-1 cũ Job <-> Contract)
DROP INDEX "Contract_jobId_key";

-- CreateIndex
CREATE INDEX "Contract_jobId_idx" ON "Contract"("jobId");
