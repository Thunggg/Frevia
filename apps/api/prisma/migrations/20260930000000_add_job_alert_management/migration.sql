-- Job Alert Management: nâng cấp JobAlert lên schema mới + tạo bảng JobAlertSkill
-- DB hiện tại (init) chỉ có: id, userId, keywords TEXT, skills TEXT[], createdAt.

-- 1) Enum types
CREATE TYPE "JobAlertFrequency" AS ENUM ('INSTANT', 'DAILY', 'WEEKLY');
CREATE TYPE "JobAlertChannel" AS ENUM ('IN_APP', 'EMAIL');

-- 2) Alter JobAlert
-- Scalar list "skills" TEXT[] thay bằng bảng quan hệ JobAlertSkill
ALTER TABLE "JobAlert" DROP COLUMN "skills";

-- name bắt buộc -> thêm default để backfill rồi bỏ default
ALTER TABLE "JobAlert" ADD COLUMN "name" VARCHAR(100) NOT NULL DEFAULT '';
ALTER TABLE "JobAlert" ALTER COLUMN "name" DROP DEFAULT;

ALTER TABLE "JobAlert" ADD COLUMN "budgetMin" DECIMAL(10,2);
ALTER TABLE "JobAlert" ADD COLUMN "budgetMax" DECIMAL(10,2);
ALTER TABLE "JobAlert" ADD COLUMN "budgetType" "BudgetType";
ALTER TABLE "JobAlert" ADD COLUMN "frequency" "JobAlertFrequency" NOT NULL DEFAULT 'INSTANT';
ALTER TABLE "JobAlert" ADD COLUMN "channels" "JobAlertChannel"[] NOT NULL DEFAULT ARRAY[]::"JobAlertChannel"[];
ALTER TABLE "JobAlert" ALTER COLUMN "channels" DROP DEFAULT;
ALTER TABLE "JobAlert" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "JobAlert" ADD COLUMN "lastTriggeredAt" TIMESTAMP(3);
ALTER TABLE "JobAlert" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "JobAlert" ALTER COLUMN "keywords" TYPE VARCHAR(255);

-- 3) Indexes
CREATE INDEX "JobAlert_userId_idx" ON "JobAlert"("userId");
CREATE INDEX "JobAlert_isActive_frequency_idx" ON "JobAlert"("isActive", "frequency");

-- 4) JobAlertSkill (nhiều-nhiều giữa JobAlert và Skill)
CREATE TABLE "JobAlertSkill" (
    "jobAlertId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,

    CONSTRAINT "JobAlertSkill_pkey" PRIMARY KEY ("jobAlertId", "skillId")
);

-- Khóa ngoại phải được tạo sau khi active id của bảng JobAlert tạo
ALTER TABLE "JobAlertSkill" ADD CONSTRAINT "JobAlertSkill_jobAlertId_fkey" FOREIGN KEY ("jobAlertId") REFERENCES "JobAlert"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "JobAlertSkill" ADD CONSTRAINT "JobAlertSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
CREATE INDEX "JobAlertSkill_skillId_idx" ON "JobAlertSkill"("skillId");