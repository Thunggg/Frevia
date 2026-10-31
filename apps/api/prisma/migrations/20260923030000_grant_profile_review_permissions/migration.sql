WITH desired("name", "path", "method", "module") AS (
    VALUES
        ('GET /api/admin/profile-revisions', '/api/admin/profile-revisions', 'GET'::"HttpMethod", 'PROFILE-REVISIONS'),
        ('GET /api/admin/profile-revisions/:id', '/api/admin/profile-revisions/:id', 'GET'::"HttpMethod", 'PROFILE-REVISIONS'),
        ('PATCH /api/admin/profile-revisions/:id/approve', '/api/admin/profile-revisions/:id/approve', 'PATCH'::"HttpMethod", 'PROFILE-REVISIONS'),
        ('PATCH /api/admin/profile-revisions/:id/reject', '/api/admin/profile-revisions/:id/reject', 'PATCH'::"HttpMethod", 'PROFILE-REVISIONS'),
        ('PATCH /api/users/:id/expert-profile', '/api/users/:id/expert-profile', 'PATCH'::"HttpMethod", 'USERS'),
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

WITH admin_paths("path", "method") AS (
    VALUES
        ('/api/admin/profile-revisions', 'GET'::"HttpMethod"),
        ('/api/admin/profile-revisions/:id', 'GET'::"HttpMethod"),
        ('/api/admin/profile-revisions/:id/approve', 'PATCH'::"HttpMethod"),
        ('/api/admin/profile-revisions/:id/reject', 'PATCH'::"HttpMethod"),
        ('/api/users/:id/expert-profile', 'PATCH'::"HttpMethod")
)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT system_role."id", permission."id"
FROM "Role" system_role
CROSS JOIN admin_paths
JOIN "Permission" permission
  ON permission."path" = admin_paths."path"
 AND permission."method" = admin_paths."method"
 AND permission."deletedAt" IS NULL
WHERE LOWER(system_role."name") = LOWER('Admin')
  AND system_role."deletedAt" IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT system_role."id", permission."id"
FROM "Role" system_role
JOIN "Permission" permission
  ON permission."path" = '/api/profile-revisions/me'
 AND permission."method" = 'GET'::"HttpMethod"
 AND permission."deletedAt" IS NULL
WHERE LOWER(system_role."name") IN (LOWER('Client'), LOWER('Freelancer'))
  AND system_role."deletedAt" IS NULL
ON CONFLICT DO NOTHING;
