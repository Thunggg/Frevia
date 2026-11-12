-- 1. Thêm cột roleId vào bảng "User" (tạm thời cho phép NULL để update dữ liệu)
ALTER TABLE "User" ADD COLUMN "roleId" INTEGER;

-- 2. Chép roleId từ "UserRole" sang "User"
-- Ưu tiên role có isPrimary = true; nếu không có, lấy roleId nhỏ nhất
UPDATE "User" u
SET "roleId" = COALESCE(
  (SELECT ur."roleId" FROM "UserRole" ur WHERE ur."userId" = u."id" AND ur."isPrimary" = true LIMIT 1),
  (SELECT ur."roleId" FROM "UserRole" ur WHERE ur."userId" = u."id" ORDER BY ur."roleId" ASC LIMIT 1),
  (SELECT r."id" FROM "Role" r WHERE r."name" = 'CLIENT' LIMIT 1)
);

-- 3. Đảm bảo roleId NOT NULL và thêm khóa ngoại
ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- 4. Tạo index cho roleId
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- 5. Xóa bỏ bảng UserRole
DROP TABLE "UserRole";
