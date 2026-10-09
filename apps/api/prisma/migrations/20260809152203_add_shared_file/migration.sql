/*
  Warnings:

  - Added the required column `publicId` to the `SharedFile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SharedFile" ADD COLUMN     "publicId" TEXT NOT NULL,
ALTER COLUMN "fileUrl" SET DATA TYPE TEXT,
ALTER COLUMN "fileName" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "SharedFile_uploaderId_idx" ON "SharedFile"("uploaderId");
