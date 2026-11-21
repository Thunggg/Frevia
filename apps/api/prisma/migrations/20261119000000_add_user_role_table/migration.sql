-- 1. Tạo bảng UserRole lưu danh sách vai trò tài khoản sở hữu (tách biệt với User.roleId là active role hiện tại)
CREATE TABLE "UserRole" (
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- 2. Index và khóa ngoại
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- 3. Backfill toàn bộ active role hiện có từ bảng User sang UserRole
INSERT INTO "UserRole" ("userId", "roleId")
SELECT "id", "roleId"
FROM "User"
ON CONFLICT ("userId", "roleId") DO NOTHING;

-- 4. Backfill vai trò marketplace thứ 2 nếu user Client/Freelancer đã có sẵn hồ sơ tương ứng
INSERT INTO "UserRole" ("userId", "roleId")
SELECT u."id", r_freelancer."id"
FROM "User" u
INNER JOIN "Role" r_active ON r_active."id" = u."roleId" AND r_active."name" = 'Client'
INNER JOIN "Profile" p ON p."userId" = u."id"
INNER JOIN "FreelancerProfile" fp ON fp."profileId" = p."id"
INNER JOIN "Role" r_freelancer ON r_freelancer."name" = 'Freelancer' AND r_freelancer."deletedAt" IS NULL
ON CONFLICT ("userId", "roleId") DO NOTHING;

INSERT INTO "UserRole" ("userId", "roleId")
SELECT u."id", r_client."id"
FROM "User" u
INNER JOIN "Role" r_active ON r_active."id" = u."roleId" AND r_active."name" = 'Freelancer'
INNER JOIN "Profile" p ON p."userId" = u."id"
INNER JOIN "ClientProfile" cp ON cp."profileId" = p."id"
INNER JOIN "Role" r_client ON r_client."name" = 'Client' AND r_client."deletedAt" IS NULL
ON CONFLICT ("userId", "roleId") DO NOTHING;
