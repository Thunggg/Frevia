-- AlterEnum
ALTER TYPE "MilestonePaymentStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';

-- DropForeignKey
ALTER TABLE IF EXISTS "Dispute" DROP CONSTRAINT IF EXISTS "Dispute_contractId_fkey";
ALTER TABLE IF EXISTS "Dispute" DROP CONSTRAINT IF EXISTS "Dispute_raisedBy_fkey";
ALTER TABLE IF EXISTS "Dispute" DROP CONSTRAINT IF EXISTS "Dispute_adminId_fkey";
ALTER TABLE IF EXISTS "DisputeEvidence" DROP CONSTRAINT IF EXISTS "DisputeEvidence_disputeId_fkey";
ALTER TABLE IF EXISTS "DisputeEvidence" DROP CONSTRAINT IF EXISTS "DisputeEvidence_userId_fkey";
ALTER TABLE IF EXISTS "DisputeTimeline" DROP CONSTRAINT IF EXISTS "DisputeTimeline_disputeId_fkey";

-- DropTable
DROP TABLE IF EXISTS "DisputeTimeline" CASCADE;
DROP TABLE IF EXISTS "DisputeEvidence" CASCADE;
DROP TABLE IF EXISTS "Dispute" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "DisputeOutcome" CASCADE;
DROP TYPE IF EXISTS "DisputeStatus" CASCADE;

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'WAITING_RESPONSE', 'UNDER_REVIEW', 'DECISION_MADE', 'REVIEW_REQUESTED', 'FINALIZED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisputeFeeStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "DisputeEvidenceType" AS ENUM ('CLAIM', 'RESPONSE');

-- CreateEnum
CREATE TYPE "DisputeDecisionResponse" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Dispute" (
    "id" SERIAL NOT NULL,
    "milestoneId" INTEGER NOT NULL,
    "openedById" INTEGER NOT NULL,
    "respondentId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "arbitrationFee" DECIMAL(10,2) NOT NULL,
    "feeDeadline" TIMESTAMP(3) NOT NULL,
    "responseDeadline" TIMESTAMP(3),
    "freelancerAmount" DECIMAL(10,2),
    "clientAmount" DECIMAL(10,2),
    "decisionReason" TEXT,
    "decisionById" INTEGER,
    "decisionAt" TIMESTAMP(3),
    "finalDecisionAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeFee" (
    "id" SERIAL NOT NULL,
    "disputeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "DisputeFeeStatus" NOT NULL DEFAULT 'PENDING',
    "paymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DisputeFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeEvidence" (
    "id" SERIAL NOT NULL,
    "disputeId" INTEGER NOT NULL,
    "submittedById" INTEGER NOT NULL,
    "type" "DisputeEvidenceType" NOT NULL,
    "description" TEXT,
    "fileId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeDecisionReview" (
    "id" SERIAL NOT NULL,
    "disputeId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "response" "DisputeDecisionResponse" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeDecisionReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_milestoneId_key" ON "Dispute"("milestoneId");
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");
CREATE INDEX "Dispute_openedById_idx" ON "Dispute"("openedById");
CREATE INDEX "Dispute_respondentId_idx" ON "Dispute"("respondentId");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeFee_disputeId_userId_key" ON "DisputeFee"("disputeId", "userId");
CREATE INDEX "DisputeFee_disputeId_idx" ON "DisputeFee"("disputeId");
CREATE INDEX "DisputeFee_userId_idx" ON "DisputeFee"("userId");

-- CreateIndex
CREATE INDEX "DisputeEvidence_disputeId_idx" ON "DisputeEvidence"("disputeId");
CREATE INDEX "DisputeEvidence_submittedById_idx" ON "DisputeEvidence"("submittedById");
CREATE INDEX "DisputeEvidence_fileId_idx" ON "DisputeEvidence"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "DisputeDecisionReview_disputeId_userId_key" ON "DisputeDecisionReview"("disputeId", "userId");
CREATE INDEX "DisputeDecisionReview_disputeId_idx" ON "DisputeDecisionReview"("disputeId");
CREATE INDEX "DisputeDecisionReview_userId_idx" ON "DisputeDecisionReview"("userId");

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_decisionById_fkey" FOREIGN KEY ("decisionById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DisputeFee" ADD CONSTRAINT "DisputeFee_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "DisputeFee" ADD CONSTRAINT "DisputeFee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "SharedFile"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DisputeDecisionReview" ADD CONSTRAINT "DisputeDecisionReview_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "DisputeDecisionReview" ADD CONSTRAINT "DisputeDecisionReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
