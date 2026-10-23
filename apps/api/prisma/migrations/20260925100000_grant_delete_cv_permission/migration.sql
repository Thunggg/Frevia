WITH desired("name", "path", "method", "module") AS (
    VALUES
        ('DELETE /api/profiles/:id/cv', '/api/profiles/:id/cv', 'DELETE'::"HttpMethod", 'PROFILES')
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
        ('/api/profiles/:id/cv', 'DELETE'::"HttpMethod")
)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN desired
JOIN "Permission" permission
  ON permission."path" = desired."path"
 AND permission."method" = desired."method"
 AND permission."deletedAt" IS NULL
WHERE LOWER(role."name") IN (LOWER('Admin'), LOWER('Freelancer'), LOWER('Client'))
  AND role."deletedAt" IS NULL
ON CONFLICT DO NOTHING;