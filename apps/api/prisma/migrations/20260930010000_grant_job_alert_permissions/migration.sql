WITH desired("name", "path", "method", "module") AS (
    VALUES
        ('GET /api/job-alerts', '/api/job-alerts', 'GET'::"HttpMethod", 'JOB-ALERTS'),
        ('POST /api/job-alerts', '/api/job-alerts', 'POST'::"HttpMethod", 'JOB-ALERTS'),
        ('GET /api/job-alerts/:id', '/api/job-alerts/:id', 'GET'::"HttpMethod", 'JOB-ALERTS'),
        ('PATCH /api/job-alerts/:id', '/api/job-alerts/:id', 'PATCH'::"HttpMethod", 'JOB-ALERTS'),
        ('DELETE /api/job-alerts/:id', '/api/job-alerts/:id', 'DELETE'::"HttpMethod", 'JOB-ALERTS')
)
INSERT INTO "Permission" ("name", "path", "method", "module", "updatedAt")
SELECT desired."name", desired."path", desired."method", desired."module", CURRENT_TIMESTAMP
FROM desired
WHERE NOT EXISTS (
    SELECT 1
    FROM "Permission"
    WHERE "Permission"."path" = desired."path"
      AND "Permission"."method" = desired."method"
      AND "Permission"."deletedAt" IS NULL
);

WITH desired("path", "method") AS (
    VALUES
        ('/api/job-alerts', 'GET'::"HttpMethod"),
        ('/api/job-alerts', 'POST'::"HttpMethod"),
        ('/api/job-alerts/:id', 'GET'::"HttpMethod"),
        ('/api/job-alerts/:id', 'PATCH'::"HttpMethod"),
        ('/api/job-alerts/:id', 'DELETE'::"HttpMethod")
)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN desired
JOIN "Permission" permission
  ON permission."path" = desired."path"
 AND permission."method" = desired."method"
 AND permission."deletedAt" IS NULL
WHERE LOWER(role."name") IN (LOWER('Admin'), LOWER('Freelancer'))
  AND role."deletedAt" IS NULL
ON CONFLICT DO NOTHING;