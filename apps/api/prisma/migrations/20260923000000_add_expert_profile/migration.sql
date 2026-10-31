ALTER TYPE "ProfileRevisionType" ADD VALUE 'EXPERT';

INSERT INTO "Role" ("name", "description", "createdAt")
SELECT 'Expert', 'Expert role (admin managed)', CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "Role" WHERE LOWER("name") = LOWER('Expert') AND "deletedAt" IS NULL
);

CREATE TABLE "ExpertProfile" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "title" VARCHAR(255),
    "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "yearsOfExperience" INTEGER,
    "education" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "website" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpertProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExpertProfile_profileId_key" ON "ExpertProfile"("profileId");

ALTER TABLE "ExpertProfile"
ADD CONSTRAINT "ExpertProfile_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
