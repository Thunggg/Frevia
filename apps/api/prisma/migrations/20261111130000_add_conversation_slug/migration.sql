-- AlterTable: Conversation
ALTER TABLE "Conversation" ADD COLUMN "slug" VARCHAR(100);

-- Backfill existing conversations with unique slug: 'conv-' || id || '-' || substr(md5(random()::text || "id"::text), 1, 8)
UPDATE "Conversation"
SET "slug" = 'conv-' || "id" || '-' || substr(md5(random()::text || "id"::text), 1, 8)
WHERE "slug" IS NULL;

-- Set slug to NOT NULL and add UNIQUE constraint
ALTER TABLE "Conversation" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Conversation_slug_key" ON "Conversation"("slug");
CREATE INDEX "Conversation_slug_idx" ON "Conversation"("slug");

