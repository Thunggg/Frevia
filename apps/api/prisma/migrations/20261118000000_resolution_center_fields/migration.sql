-- Add Resolution Center fields to Dispute table (Fiverr-style Resolution Center)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DisputeResolutionType') THEN
    CREATE TYPE "DisputeResolutionType" AS ENUM (
      'EXTEND_DEADLINE',
      'PARTIAL_REFUND',
      'FULL_REFUND',
      'FULL_RELEASE'
    );
  END IF;
END
$$;

ALTER TABLE "Dispute"
  ADD COLUMN IF NOT EXISTS "resolutionType" "DisputeResolutionType" NOT NULL DEFAULT 'FULL_REFUND',
  ADD COLUMN IF NOT EXISTS "proposedFreelancerAmount" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "proposedClientAmount" DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS "proposedDueDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "previousMilestoneStatus" "MilestoneStatus",
  ADD COLUMN IF NOT EXISTS "declineReason" TEXT,
  ADD COLUMN IF NOT EXISTS "declinedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "escalatedAt" TIMESTAMP(3);
