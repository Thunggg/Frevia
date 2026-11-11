-- AlterTable
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "holdPaymentIntentId" TEXT;
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "holdMilestoneIds" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Contract_holdPaymentIntentId_key" ON "Contract"("holdPaymentIntentId");

