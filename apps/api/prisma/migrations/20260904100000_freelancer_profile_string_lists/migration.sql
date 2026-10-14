-- Chuyển 3 cột FreelancerProfile.education / certifications / languages
-- từ Json (jsonb) sang kiểu text[] (scalar list) trong Prisma.
--
-- KHÔNG dùng ALTER ... TYPE ... USING vì transform expression không cho subquery.
-- Cách làm: thêm cột tạm text[] → backfill bằng UPDATE (subquery OK) → drop cột cũ → rename.
-- Backfill: phần tử string giữ nguyên; phần tử khác lưu dạng JSON text; json null bỏ qua;
-- NULL / không phải mảng → {}.
-- Cột mới: NOT NULL DEFAULT '{}' (khớp Prisma `String[] @default([])`).

-- ============ education ============
ALTER TABLE "FreelancerProfile"
  ADD COLUMN "education_tmp" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "FreelancerProfile"
SET "education_tmp" = COALESCE(
      ARRAY(
        SELECT
          CASE
            WHEN jsonb_typeof(elem) = 'string' THEN elem #>> '{}'
            ELSE elem::TEXT
          END
        FROM jsonb_array_elements(("education")::jsonb) AS elem
        WHERE jsonb_typeof(elem) <> 'null'
      ),
      ARRAY[]::TEXT[]
    )
WHERE "education" IS NOT NULL
  AND jsonb_typeof(("education")::jsonb) = 'array';

ALTER TABLE "FreelancerProfile" DROP COLUMN "education";
ALTER TABLE "FreelancerProfile" RENAME COLUMN "education_tmp" TO "education";

-- ============ certifications ============
ALTER TABLE "FreelancerProfile"
  ADD COLUMN "certifications_tmp" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "FreelancerProfile"
SET "certifications_tmp" = COALESCE(
      ARRAY(
        SELECT
          CASE
            WHEN jsonb_typeof(elem) = 'string' THEN elem #>> '{}'
            ELSE elem::TEXT
          END
        FROM jsonb_array_elements(("certifications")::jsonb) AS elem
        WHERE jsonb_typeof(elem) <> 'null'
      ),
      ARRAY[]::TEXT[]
    )
WHERE "certifications" IS NOT NULL
  AND jsonb_typeof(("certifications")::jsonb) = 'array';

ALTER TABLE "FreelancerProfile" DROP COLUMN "certifications";
ALTER TABLE "FreelancerProfile" RENAME COLUMN "certifications_tmp" TO "certifications";

-- ============ languages ============
ALTER TABLE "FreelancerProfile"
  ADD COLUMN "languages_tmp" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "FreelancerProfile"
SET "languages_tmp" = COALESCE(
      ARRAY(
        SELECT
          CASE
            WHEN jsonb_typeof(elem) = 'string' THEN elem #>> '{}'
            ELSE elem::TEXT
          END
        FROM jsonb_array_elements(("languages")::jsonb) AS elem
        WHERE jsonb_typeof(elem) <> 'null'
      ),
      ARRAY[]::TEXT[]
    )
WHERE "languages" IS NOT NULL
  AND jsonb_typeof(("languages")::jsonb) = 'array';

ALTER TABLE "FreelancerProfile" DROP COLUMN "languages";
ALTER TABLE "FreelancerProfile" RENAME COLUMN "languages_tmp" TO "languages";
