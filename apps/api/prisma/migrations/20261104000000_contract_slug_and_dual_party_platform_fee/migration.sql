-- AlterTable: Contract
ALTER TABLE "Contract" ADD COLUMN "slug" VARCHAR(255);
ALTER TABLE "Contract" ADD COLUMN "clientFeeStatus" "PlatformFeeStatus" NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "Contract" ADD COLUMN "clientFeePaidAt" TIMESTAMP(3);
ALTER TABLE "Contract" ADD COLUMN "freelancerFeeStatus" "PlatformFeeStatus" NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "Contract" ADD COLUMN "freelancerFeePaidAt" TIMESTAMP(3);

-- Backfill existing contracts with slug: 'contract-' || id
UPDATE "Contract"
SET "slug" = 'contract-' || "id"
WHERE "slug" IS NULL;

-- Set slug to NOT NULL and add UNIQUE constraint
ALTER TABLE "Contract" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Contract_slug_key" ON "Contract"("slug");
