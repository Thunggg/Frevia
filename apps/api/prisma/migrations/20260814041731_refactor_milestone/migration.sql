/*
  Warnings:

  - The values [CANCELLED] on the enum `MilestoneStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `completionPercent` on the `Milestone` table. All the data in the column will be lost.
  - You are about to drop the `ContractActivityLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GasFeeSubsidy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RevisionRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskChecklist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WalletWithdrawal` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount` to the `Milestone` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MilestonePaymentStatus" AS ENUM ('PENDING', 'FUNDED', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING_REVIEW', 'CHANGES_REQUESTED', 'APPROVED');

-- AlterEnum
BEGIN;
CREATE TYPE "MilestoneStatus_new" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'CHANGES_REQUESTED', 'COMPLETED', 'DISPUTED');
ALTER TABLE "public"."Milestone" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Milestone" ALTER COLUMN "status" TYPE "MilestoneStatus_new" USING ("status"::text::"MilestoneStatus_new");
ALTER TYPE "MilestoneStatus" RENAME TO "MilestoneStatus_old";
ALTER TYPE "MilestoneStatus_new" RENAME TO "MilestoneStatus";
DROP TYPE "public"."MilestoneStatus_old";
ALTER TABLE "Milestone" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "ContractActivityLog" DROP CONSTRAINT "ContractActivityLog_contractId_fkey";

-- DropForeignKey
ALTER TABLE "ContractActivityLog" DROP CONSTRAINT "ContractActivityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "GasFeeSubsidy" DROP CONSTRAINT "GasFeeSubsidy_userId_fkey";

-- DropForeignKey
ALTER TABLE "RevisionRequest" DROP CONSTRAINT "RevisionRequest_milestoneId_fkey";

-- DropForeignKey
ALTER TABLE "RevisionRequest" DROP CONSTRAINT "RevisionRequest_requestedBy_fkey";

-- DropForeignKey
ALTER TABLE "TaskChecklist" DROP CONSTRAINT "TaskChecklist_milestoneId_fkey";

-- DropForeignKey
ALTER TABLE "WalletWithdrawal" DROP CONSTRAINT "WalletWithdrawal_userId_fkey";

-- AlterTable
ALTER TABLE "Milestone" DROP COLUMN "completionPercent",
ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "paymentStatus" "MilestonePaymentStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "title" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "ContractActivityLog";

-- DropTable
DROP TABLE "GasFeeSubsidy";

-- DropTable
DROP TABLE "RevisionRequest";

-- DropTable
DROP TABLE "TaskChecklist";

-- DropTable
DROP TABLE "WalletWithdrawal";

-- DropEnum
DROP TYPE "ContractActivityAction";

-- DropEnum
DROP TYPE "SubsidyStatus";

-- DropEnum
DROP TYPE "WithdrawalStatus";

-- CreateTable
CREATE TABLE "MilestoneFile" (
    "id" SERIAL NOT NULL,
    "milestoneId" INTEGER NOT NULL,
    "uploaderId" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MilestoneFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneSubmission" (
    "id" SERIAL NOT NULL,
    "milestoneId" INTEGER NOT NULL,
    "freelancerId" INTEGER NOT NULL,
    "message" TEXT,
    "links" TEXT[],
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "changeRequestMessage" TEXT,
    "changeRequestDueDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilestoneSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneSubmissionFile" (
    "submissionId" INTEGER NOT NULL,
    "fileId" INTEGER NOT NULL,

    CONSTRAINT "MilestoneSubmissionFile_pkey" PRIMARY KEY ("submissionId","fileId")
);

-- CreateIndex
CREATE INDEX "MilestoneFile_milestoneId_idx" ON "MilestoneFile"("milestoneId");

-- CreateIndex
CREATE INDEX "MilestoneFile_uploaderId_idx" ON "MilestoneFile"("uploaderId");

-- CreateIndex
CREATE INDEX "MilestoneSubmission_milestoneId_idx" ON "MilestoneSubmission"("milestoneId");

-- CreateIndex
CREATE INDEX "MilestoneSubmission_freelancerId_idx" ON "MilestoneSubmission"("freelancerId");

-- CreateIndex
CREATE INDEX "MilestoneSubmissionFile_fileId_idx" ON "MilestoneSubmissionFile"("fileId");

-- AddForeignKey
ALTER TABLE "MilestoneFile" ADD CONSTRAINT "MilestoneFile_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MilestoneFile" ADD CONSTRAINT "MilestoneFile_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MilestoneSubmission" ADD CONSTRAINT "MilestoneSubmission_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MilestoneSubmission" ADD CONSTRAINT "MilestoneSubmission_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MilestoneSubmissionFile" ADD CONSTRAINT "MilestoneSubmissionFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "MilestoneSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneSubmissionFile" ADD CONSTRAINT "MilestoneSubmissionFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "MilestoneFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
