WITH desired("name", "path", "method", "module") AS (
    VALUES
        ('GET /api/auth/me', '/api/auth/me', 'GET'::"HttpMethod", 'AUTH'),
        ('GET /api/expert-profile/me', '/api/expert-profile/me', 'GET'::"HttpMethod", 'EXPERT-PROFILE'),
        ('PUT /api/expert-profile/me', '/api/expert-profile/me', 'PUT'::"HttpMethod", 'EXPERT-PROFILE'),
        ('GET /api/profile-revisions/me', '/api/profile-revisions/me', 'GET'::"HttpMethod", 'PROFILE-REVISIONS')
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
        ('/api/auth/me', 'GET'::"HttpMethod"),
        ('/api/expert-profile/me', 'GET'::"HttpMethod"),
        ('/api/expert-profile/me', 'PUT'::"HttpMethod"),
        ('/api/profile-revisions/me', 'GET'::"HttpMethod")
)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN desired
JOIN "Permission" permission
  ON permission."path" = desired."path"
 AND permission."method" = desired."method"
 AND permission."deletedAt" IS NULL
WHERE LOWER(role."name") = LOWER('Expert')
  AND role."deletedAt" IS NULL
ON CONFLICT DO NOTHING;
