CREATE TABLE "Expert" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "certifications" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expert_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Expert_profileId_key" ON "Expert"("profileId");

ALTER TABLE "Expert" ADD CONSTRAINT "Expert_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
