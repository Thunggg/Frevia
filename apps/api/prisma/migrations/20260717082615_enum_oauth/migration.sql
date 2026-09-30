/*
  Warnings:

  - Changed the type of `provider` on the `OauthAccount` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OauthProvider" AS ENUM ('GOOGLE');

-- AlterTable
ALTER TABLE "OauthAccount" DROP COLUMN "provider",
ADD COLUMN     "provider" "OauthProvider" NOT NULL;

-- CreateIndex
CREATE INDEX "ForumCategory_deletedAt_name_idx" ON "ForumCategory"("deletedAt", "name");

-- CreateIndex
CREATE UNIQUE INDEX "OauthAccount_provider_providerUserId_key" ON "OauthAccount"("provider", "providerUserId");
