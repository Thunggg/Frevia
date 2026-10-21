CREATE TYPE "ProfileRevisionType" AS ENUM ('CLIENT', 'FREELANCER');

CREATE TABLE "ProfileRevision" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "profileType" "ProfileRevisionType" NOT NULL,
    "status" "RevisionStatus" NOT NULL DEFAULT 'PENDING',
    "currentData" JSONB NOT NULL,
    "proposedData" JSONB NOT NULL,
    "profileStrength" INTEGER NOT NULL,
    "adminId" INTEGER,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ProfileRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProfileRevision_userId_profileType_status_idx"
ON "ProfileRevision"("userId", "profileType", "status");

CREATE INDEX "ProfileRevision_status_createdAt_idx"
ON "ProfileRevision"("status", "createdAt");

CREATE INDEX "ProfileRevision_profileId_idx"
ON "ProfileRevision"("profileId");

ALTER TABLE "ProfileRevision"
ADD CONSTRAINT "ProfileRevision_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "ProfileRevision"
ADD CONSTRAINT "ProfileRevision_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "ProfileRevision"
ADD CONSTRAINT "ProfileRevision_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
