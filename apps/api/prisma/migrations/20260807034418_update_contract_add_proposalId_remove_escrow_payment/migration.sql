-- Migration: update_contract_add_proposalId_remove_escrow_payment
-- AlterTable: Contract
-- Remove: escrowContractAddress, depositPercent, paymentStatus
-- Add: proposalId (unique FK to Proposal)

-- Step 1: Add proposalId column (nullable first to allow existing rows)
ALTER TABLE "Contract" ADD COLUMN "proposalId" INTEGER;

-- Step 2: Drop removed columns
ALTER TABLE "Contract" DROP COLUMN IF EXISTS "escrowContractAddress";
ALTER TABLE "Contract" DROP COLUMN IF EXISTS "depositPercent";
ALTER TABLE "Contract" DROP COLUMN IF EXISTS "paymentStatus";

-- Step 3: Make proposalId NOT NULL (only safe if no existing rows, or after backfill)
-- If you have existing data, you must first backfill proposalId before running this:
ALTER TABLE "Contract" ALTER COLUMN "proposalId" SET NOT NULL;

-- Step 4: Add unique constraint on proposalId
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_proposalId_key" UNIQUE ("proposalId");

-- Step 5: Add foreign key constraint from Contract.proposalId to Proposal.id
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_proposalId_fkey"
  FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;
