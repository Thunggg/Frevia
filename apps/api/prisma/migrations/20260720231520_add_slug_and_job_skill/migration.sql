/*
  Warnings:

  - The primary key for the `JobSkill` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `JobSkill` table. All the data in the column will be lost.
  - You are about to drop the column `skillName` on the `JobSkill` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Job` table without a default value. This is not possible if the table is not empty.
  - Added the required column `skillId` to the `JobSkill` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "JobSkill" DROP CONSTRAINT "JobSkill_jobId_fkey";

-- DropIndex
DROP INDEX "Job_clientId_idx";

-- DropIndex
DROP INDEX "Job_createdAt_idx";

-- DropIndex
DROP INDEX "Job_status_idx";

-- DropIndex
DROP INDEX "JobSkill_jobId_idx";

-- DropIndex
DROP INDEX "JobSkill_skillName_idx";

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "slug" VARCHAR(300) NOT NULL;

-- AlterTable
ALTER TABLE "JobSkill" DROP CONSTRAINT "JobSkill_pkey",
DROP COLUMN "id",
DROP COLUMN "skillName",
ADD COLUMN     "skillId" INTEGER NOT NULL,
ADD CONSTRAINT "JobSkill_pkey" PRIMARY KEY ("jobId", "skillId");

-- DropEnum
DROP TYPE "RoleName";

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE INDEX "Skill_isActive_idx" ON "Skill"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Job_slug_key" ON "Job"("slug");

-- CreateIndex
CREATE INDEX "Job_status_deletedAt_createdAt_idx" ON "Job"("status", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Job_clientId_deletedAt_createdAt_idx" ON "Job"("clientId", "deletedAt", "createdAt");

-- CreateIndex
CREATE INDEX "Job_budgetType_idx" ON "Job"("budgetType");

-- CreateIndex
CREATE INDEX "JobSkill_skillId_idx" ON "JobSkill"("skillId");

-- AddForeignKey
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "JobSkill" ADD CONSTRAINT "JobSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
