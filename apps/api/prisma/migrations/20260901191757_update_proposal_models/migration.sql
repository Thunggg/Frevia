/*
  Warnings:

  - You are about to drop the column `deliveryTime` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `isDraft` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `ProposalTemplate` table. All the data in the column will be lost.
  - Added the required column `deliveryDays` to the `Proposal` table without a default value. This is not possible if the table is not empty.
  - Made the column `fileName` on table `ProposalAttachment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `coverLetter` to the `ProposalTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProposalTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ProposalStatus" ADD VALUE 'DRAFT';

-- DropIndex
DROP INDEX "Proposal_freelancerId_idx";

-- DropIndex
DROP INDEX "Proposal_jobId_idx";

-- DropIndex
DROP INDEX "Proposal_status_idx";

-- AlterTable
ALTER TABLE "ForumCategory" ALTER COLUMN "slug" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ForumPost" ALTER COLUMN "slug" DROP DEFAULT;


-- AlterTable
ALTER TABLE "Proposal"
ADD COLUMN "acceptedAt" TIMESTAMP(3),
ADD COLUMN "deliveryDays" INTEGER,
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "withdrawnAt" TIMESTAMP(3);

-- Copy dữ liệu cũ từ deliveryTime sang deliveryDays
UPDATE "Proposal"
SET "deliveryDays" = "deliveryTime"
WHERE "deliveryTime" IS NOT NULL;

-- deliveryDays là bắt buộc
ALTER TABLE "Proposal"
ALTER COLUMN "deliveryDays" SET NOT NULL;

-- Xóa các cột cũ sau khi đã migrate dữ liệu
ALTER TABLE "Proposal"
DROP COLUMN "deliveryTime",
DROP COLUMN "isDraft";

-- Update các column còn lại
ALTER TABLE "Proposal"
ALTER COLUMN "bidAmount" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "status" SET DEFAULT 'DRAFT';


-- AlterTable
ALTER TABLE "ProposalAttachment" ADD COLUMN     "mimeType" VARCHAR(100),
ALTER COLUMN "fileName" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProposalTemplate" DROP COLUMN "content",
ADD COLUMN     "bidAmount" DECIMAL(15,2),
ADD COLUMN     "coverLetter" TEXT NOT NULL,
ADD COLUMN     "deliveryDays" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Proposal_jobId_deletedAt_createdAt_idx" ON "Proposal"("jobId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_freelancerId_deletedAt_createdAt_idx" ON "Proposal"("freelancerId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Proposal_status_deletedAt_idx" ON "Proposal"("status", "deletedAt");

-- CreateIndex
CREATE INDEX "ProposalAttachment_proposalId_deletedAt_idx" ON "ProposalAttachment"("proposalId", "deletedAt");

-- CreateIndex
CREATE INDEX "ProposalTemplate_freelancerId_deletedAt_idx" ON "ProposalTemplate"("freelancerId", "deletedAt");
