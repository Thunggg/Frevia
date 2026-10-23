CREATE TYPE "ExpertConsultationType" AS ENUM (
  'PROFILE_REVIEW',
  'CV_REVIEW',
  'JOB_REVIEW',
  'CAREER_GUIDANCE',
  'DISPUTE_ADVICE',
  'OTHER'
);

CREATE TYPE "ExpertConsultationStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED'
);

CREATE TABLE "ExpertConsultation" (
  "id" SERIAL NOT NULL,
  "requesterId" INTEGER NOT NULL,
  "expertId" INTEGER NOT NULL,
  "requesterRole" VARCHAR(50) NOT NULL,
  "type" "ExpertConsultationType" NOT NULL,
  "status" "ExpertConsultationStatus" NOT NULL DEFAULT 'PENDING',
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "expertResponse" TEXT,
  "rejectionReason" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ExpertConsultation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExpertConsultation_requesterId_status_createdAt_idx"
  ON "ExpertConsultation"("requesterId", "status", "createdAt");

CREATE INDEX "ExpertConsultation_expertId_status_createdAt_idx"
  ON "ExpertConsultation"("expertId", "status", "createdAt");

CREATE UNIQUE INDEX "ExpertConsultation_active_requester_expert_key"
  ON "ExpertConsultation"("requesterId", "expertId")
  WHERE "status" IN ('PENDING', 'ACCEPTED', 'IN_PROGRESS');

ALTER TABLE "ExpertConsultation"
  ADD CONSTRAINT "ExpertConsultation_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "ExpertConsultation"
  ADD CONSTRAINT "ExpertConsultation_expertId_fkey"
  FOREIGN KEY ("expertId") REFERENCES "Expert"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

WITH desired("name", "path", "method", "module") AS (
  VALUES
    ('POST /api/expert-consultations', '/api/expert-consultations', 'POST'::"HttpMethod", 'EXPERT-CONSULTATIONS'),
    ('GET /api/expert-consultations/mine', '/api/expert-consultations/mine', 'GET'::"HttpMethod", 'EXPERT-CONSULTATIONS'),
    ('GET /api/expert-consultations/assigned', '/api/expert-consultations/assigned', 'GET'::"HttpMethod", 'EXPERT-CONSULTATIONS'),
    ('GET /api/expert-consultations/:id', '/api/expert-consultations/:id', 'GET'::"HttpMethod", 'EXPERT-CONSULTATIONS'),
    ('PATCH /api/expert-consultations/:id/accept', '/api/expert-consultations/:id/accept', 'PATCH'::"HttpMethod", 'EXPERT-CONSULTATIONS'),
    ('PATCH /api/expert-consultations/:id/reject', '/api/expert-consultations/:id/reject', 'PATCH'::"HttpMethod", 'EXPERT-CONSULTATIONS'),
    ('PATCH /api/expert-consultations/:id/start', '/api/expert-consultations/:id/start', 'PATCH'::"HttpMethod", 'EXPERT-CONSULTATIONS'),
    ('PATCH /api/expert-consultations/:id/complete', '/api/expert-consultations/:id/complete', 'PATCH'::"HttpMethod", 'EXPERT-CONSULTATIONS'),
    ('PATCH /api/expert-consultations/:id/cancel', '/api/expert-consultations/:id/cancel', 'PATCH'::"HttpMethod", 'EXPERT-CONSULTATIONS')
)
INSERT INTO "Permission" ("name", "path", "method", "module", "updatedAt")
SELECT desired."name", desired."path", desired."method", desired."module", CURRENT_TIMESTAMP
FROM desired
WHERE NOT EXISTS (
  SELECT 1 FROM "Permission"
  WHERE "Permission"."path" = desired."path"
    AND "Permission"."method" = desired."method"
    AND "Permission"."deletedAt" IS NULL
);

WITH requester_paths("path", "method") AS (
  VALUES
    ('/api/expert-consultations', 'POST'::"HttpMethod"),
    ('/api/expert-consultations/mine', 'GET'::"HttpMethod"),
    ('/api/expert-consultations/:id', 'GET'::"HttpMethod"),
    ('/api/expert-consultations/:id/cancel', 'PATCH'::"HttpMethod")
)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN requester_paths
JOIN "Permission" permission
  ON permission."path" = requester_paths."path"
 AND permission."method" = requester_paths."method"
 AND permission."deletedAt" IS NULL
WHERE LOWER(role."name") IN (LOWER('Client'), LOWER('Freelancer'), LOWER('Admin'))
  AND role."deletedAt" IS NULL
ON CONFLICT DO NOTHING;

WITH expert_paths("path", "method") AS (
  VALUES
    ('/api/expert-consultations/assigned', 'GET'::"HttpMethod"),
    ('/api/expert-consultations/:id', 'GET'::"HttpMethod"),
    ('/api/expert-consultations/:id/accept', 'PATCH'::"HttpMethod"),
    ('/api/expert-consultations/:id/reject', 'PATCH'::"HttpMethod"),
    ('/api/expert-consultations/:id/start', 'PATCH'::"HttpMethod"),
    ('/api/expert-consultations/:id/complete', 'PATCH'::"HttpMethod")
)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN expert_paths
JOIN "Permission" permission
  ON permission."path" = expert_paths."path"
 AND permission."method" = expert_paths."method"
 AND permission."deletedAt" IS NULL
WHERE LOWER(role."name") IN (LOWER('Expert'), LOWER('Admin'))
  AND role."deletedAt" IS NULL
ON CONFLICT DO NOTHING;
