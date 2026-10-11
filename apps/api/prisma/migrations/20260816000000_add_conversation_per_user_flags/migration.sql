-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN "participant1HiddenAt" TIMESTAMP(3),
ADD COLUMN "participant1PinnedAt" TIMESTAMP(3),
ADD COLUMN "participant2HiddenAt" TIMESTAMP(3),
ADD COLUMN "participant2PinnedAt" TIMESTAMP(3);
