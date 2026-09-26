/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Session` table. All the data in the column will be lost.
  - You are about to drop the column `revoked` on the `Session` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "deletedAt",
DROP COLUMN "revoked";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "isBanned" SET DEFAULT false;
