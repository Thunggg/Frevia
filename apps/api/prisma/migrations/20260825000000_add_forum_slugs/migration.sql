-- AlterTable: Add slug column to ForumCategory (temporary empty default)
ALTER TABLE "ForumCategory" ADD COLUMN "slug" VARCHAR(280) NOT NULL DEFAULT '';

-- AlterTable: Add slug column to ForumPost (temporary empty default)
ALTER TABLE "ForumPost" ADD COLUMN "slug" VARCHAR(320) NOT NULL DEFAULT '';

-- Backfill: Generate slugs for existing ForumCategory rows BEFORE unique index
UPDATE "ForumCategory" SET "slug" = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  "name",
  ' ', '-'),
  '.', ''),
  ',', ''),
  '/', '-'),
  '&', 'and')) || '-' || "id" WHERE "slug" = '';

-- Backfill: Generate slugs for existing ForumPost rows BEFORE unique index
UPDATE "ForumPost" SET "slug" = LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  "title",
  ' ', '-'),
  '.', ''),
  ',', ''),
  '/', '-'),
  '&', 'and')) || '-' || "id" WHERE "slug" = '';

-- CreateIndex: Unique index on ForumCategory.slug (after backfill)
CREATE UNIQUE INDEX "ForumCategory_slug_key" ON "ForumCategory"("slug");

-- CreateIndex: Unique index on ForumPost.slug (after backfill)
CREATE UNIQUE INDEX "ForumPost_slug_key" ON "ForumPost"("slug");
