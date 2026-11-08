-- CreateEnum
CREATE TYPE "JobAlertFrequency" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- AlterTable
ALTER TABLE "JobAlert"
  ADD COLUMN "name" VARCHAR(100),
  ADD COLUMN "frequency" "JobAlertFrequency" NOT NULL DEFAULT 'DAILY',
  ADD COLUMN "channels" "NotificationChannel"[] NOT NULL DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lastSentAt" TIMESTAMP(3),
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "JobAlert_userId_isActive_idx" ON "JobAlert"("userId", "isActive");

-- RedefineForeignKey
ALTER TABLE "JobAlert" DROP CONSTRAINT "JobAlert_userId_fkey";
ALTER TABLE "JobAlert" ADD CONSTRAINT "JobAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

