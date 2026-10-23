-- Cấp quyền cho module Admin quản lý danh mục công việc (UC-46).
-- PermissionGuard chặn theo method + path và fail-closed: thiếu row ở đây là 403.

WITH desired("name", "path", "method", "module") AS (
    VALUES
        ('GET /api/admin/job-categories', '/api/admin/job-categories', 'GET'::"HttpMethod", 'ADMIN'),
        ('POST /api/admin/job-categories', '/api/admin/job-categories', 'POST'::"HttpMethod", 'ADMIN'),
        ('GET /api/admin/job-categories/:id', '/api/admin/job-categories/:id', 'GET'::"HttpMethod", 'ADMIN'),
        ('PATCH /api/admin/job-categories/:id', '/api/admin/job-categories/:id', 'PATCH'::"HttpMethod", 'ADMIN'),
        ('DELETE /api/admin/job-categories/:id', '/api/admin/job-categories/:id', 'DELETE'::"HttpMethod", 'ADMIN'),
        ('PATCH /api/admin/job-categories/:id/restore', '/api/admin/job-categories/:id/restore', 'PATCH'::"HttpMethod", 'ADMIN')
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
        ('/api/admin/job-categories', 'GET'::"HttpMethod"),
        ('/api/admin/job-categories', 'POST'::"HttpMethod"),
        ('/api/admin/job-categories/:id', 'GET'::"HttpMethod"),
        ('/api/admin/job-categories/:id', 'PATCH'::"HttpMethod"),
        ('/api/admin/job-categories/:id', 'DELETE'::"HttpMethod"),
        ('/api/admin/job-categories/:id/restore', 'PATCH'::"HttpMethod")
)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
CROSS JOIN desired
JOIN "Permission" permission
  ON permission."path" = desired."path"
 AND permission."method" = desired."method"
 AND permission."deletedAt" IS NULL
WHERE LOWER(role."name") = LOWER('Admin')
  AND role."deletedAt" IS NULL
ON CONFLICT DO NOTHING;
