-- Xoa trang thai INTERVIEWING khoi ProposalStatus enum va chuyen cac proposal dang o trang thai nay sang SUBMITTED

-- 1) Backfill: Neu co proposal nao dang o INTERVIEWING thi chuyen ve SUBMITTED
UPDATE "Proposal"
SET "status" = 'SUBMITTED'
WHERE "status"::text = 'INTERVIEWING';

-- 2) Recreate ProposalStatus enum ma khong co INTERVIEWING
CREATE TYPE "ProposalStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'HIRED', 'REJECTED', 'WITHDRAWN', 'EXPIRED');

ALTER TABLE "Proposal" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Proposal" ALTER COLUMN "status" TYPE "ProposalStatus_new" USING ("status"::text::"ProposalStatus_new");

ALTER TYPE "ProposalStatus" RENAME TO "ProposalStatus_old";

ALTER TYPE "ProposalStatus_new" RENAME TO "ProposalStatus";

DROP TYPE "ProposalStatus_old";

ALTER TABLE "Proposal" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- 3) Xoa quyen PATCH /api/proposals/:id/interview neu ton tai
DELETE FROM "RolePermission" WHERE "permissionId" IN (
  SELECT "id" FROM "Permission" WHERE "method" = 'PATCH' AND "path" = '/api/proposals/:id/interview'
);
DELETE FROM "Permission" WHERE "method" = 'PATCH' AND "path" = '/api/proposals/:id/interview';
