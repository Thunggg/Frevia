-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'WITHDRAWAL';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "WithdrawalMethod" AS ENUM ('BANK_TRANSFER', 'STRIPE_EXPRESS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "walletBalance" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- CreateTable
CREATE TABLE IF NOT EXISTS "WithdrawalRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'usd',
    "method" "WithdrawalMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "bankName" VARCHAR(150),
    "bankAccountNumber" VARCHAR(100),
    "bankAccountHolder" VARCHAR(150),
    "note" TEXT,
    "stripeTransferId" TEXT,
    "processedAt" TIMESTAMP(3),
    "processedById" INTEGER,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WithdrawalRequest_stripeTransferId_key" ON "WithdrawalRequest"("stripeTransferId");
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_userId_createdAt_idx" ON "WithdrawalRequest"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

