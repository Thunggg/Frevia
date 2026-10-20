ALTER TABLE "Expert"
ADD COLUMN IF NOT EXISTS "title" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "expertise" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "education" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "website" VARCHAR(500);

INSERT INTO "Expert" (
    "profileId",
    "title",
    "expertise",
    "yearsOfExperience",
    "education",
    "certifications",
    "website",
    "updatedAt"
)
SELECT
    legacy."profileId",
    legacy."title",
    COALESCE(legacy."expertise", ARRAY[]::TEXT[]),
    COALESCE(legacy."yearsOfExperience", 0),
    COALESCE(legacy."education", ARRAY[]::TEXT[]),
    COALESCE(legacy."certifications", ARRAY[]::TEXT[]),
    legacy."website",
    CURRENT_TIMESTAMP
FROM "ExpertProfile" legacy
ON CONFLICT ("profileId") DO UPDATE SET
    "title" = COALESCE(EXCLUDED."title", "Expert"."title"),
    "expertise" = CASE WHEN cardinality(EXCLUDED."expertise") > 0 THEN EXCLUDED."expertise" ELSE "Expert"."expertise" END,
    "yearsOfExperience" = GREATEST(EXCLUDED."yearsOfExperience", "Expert"."yearsOfExperience"),
    "education" = CASE WHEN cardinality(EXCLUDED."education") > 0 THEN EXCLUDED."education" ELSE "Expert"."education" END,
    "certifications" = CASE WHEN cardinality(EXCLUDED."certifications") > 0 THEN EXCLUDED."certifications" ELSE "Expert"."certifications" END,
    "website" = COALESCE(EXCLUDED."website", "Expert"."website"),
    "updatedAt" = CURRENT_TIMESTAMP;

DROP TABLE "ExpertProfile";
