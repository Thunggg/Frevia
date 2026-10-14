-- Normalize Skill & FreelancerSkill models
-- 1) Skill: isActive (Boolean) -> deletedAt (DateTime?) + partial unique indexes
-- 2) FreelancerSkill: skillName (free text) -> skillId (FK chuẩn hoá)

-- ============ Skill: isActive -> deletedAt ============
-- Thêm cột deletedAt, map skill đang bị tắt (isActive = false) sang trạng thái đã xoá
ALTER TABLE "Skill" ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "Skill"
SET "deletedAt" = NOW()
WHERE "isActive" = false;

-- Bỏ unique index cũ (phải drop TRƯỚC khi drop cột isActive, vì drop cột sẽ tự drop index kèm theo)
DROP INDEX "Skill_name_key";
DROP INDEX "Skill_slug_key";
DROP INDEX "Skill_isActive_idx";

ALTER TABLE "Skill" DROP COLUMN "isActive";

-- Partial unique index: chỉ ràng buộc các skill còn hoạt động (deletedAt IS NULL)
CREATE UNIQUE INDEX idx_skills_name_active ON "Skill" ("name") WHERE "deletedAt" IS NULL;
CREATE UNIQUE INDEX idx_skills_slug_active ON "Skill" ("slug") WHERE "deletedAt" IS NULL;
CREATE INDEX "Skill_deletedAt_idx" ON "Skill" ("deletedAt");

-- ============ FreelancerSkill: backfill catalog trước khi đổi sang FK ============
-- Skill free-text trong FreelancerSkill chưa tồn tại trong catalog -> tạo row mới.
-- Slug sinh giống pattern hiện có (lowercase, bỏ ký tự đặc biệt, khoảng trắng -> "-").
WITH missing AS (
  SELECT DISTINCT ON (lower(trim(fs."skillName")))
         trim(fs."skillName") AS name
  FROM "FreelancerSkill" fs
  WHERE trim(fs."skillName") <> ''
    AND NOT EXISTS (
      SELECT 1 FROM "Skill" s
      WHERE lower(s."name") = lower(trim(fs."skillName"))
    )
)
INSERT INTO "Skill" ("name", "slug", "createdAt", "updatedAt")
SELECT m.name,
       lower(
         regexp_replace(
           regexp_replace(m.name, '[^[:alnum:]_[:space:]-]', '', 'g'),
           '[[:space:]]+',
           '-',
           'g'
         )
       ),
       NOW(),
       NOW()
FROM missing m
ON CONFLICT (slug) WHERE "deletedAt" IS NULL DO NOTHING;

-- ============ FreelancerSkill: skillName -> skillId ============
ALTER TABLE "FreelancerSkill" ADD COLUMN "skillId" INTEGER;

-- Gán skillId dựa trên tên skill (case-insensitive) sau khi đã backfill xong
UPDATE "FreelancerSkill" fs
SET "skillId" = s.id
FROM "Skill" s
WHERE lower(s."name") = lower(fs."skillName");

-- Kỹ năng rỗng không thể map sang catalog -> thả luôn dòng rác
DELETE FROM "FreelancerSkill" WHERE trim("skillName") = '';

ALTER TABLE "FreelancerSkill" ALTER COLUMN "skillId" SET NOT NULL;

DROP INDEX "FreelancerSkill_skillName_idx";
ALTER TABLE "FreelancerSkill" DROP COLUMN "skillName";

ALTER TABLE "FreelancerSkill"
  ADD CONSTRAINT "FreelancerSkill_skillId_fkey"
  FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- Tránh thêm trùng 1 skill nhiều lần cho cùng freelancer
ALTER TABLE "FreelancerSkill"
  ADD CONSTRAINT "FreelancerSkill_freelancerProfileId_skillId_key"
  UNIQUE ("freelancerProfileId", "skillId");

CREATE INDEX "FreelancerSkill_skillId_idx" ON "FreelancerSkill"("skillId");