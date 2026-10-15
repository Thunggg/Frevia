-- Thêm cột skillName cho bảng FreelancerSkill để đồng bộ với schema Prisma và code logic
ALTER TABLE "FreelancerSkill" ADD COLUMN IF NOT EXISTS "skillName" VARCHAR(100);

UPDATE "FreelancerSkill" fs
SET "skillName" = s.name
FROM "Skill" s
WHERE fs."skillId" = s.id AND (fs."skillName" IS NULL OR fs."skillName" = '');

ALTER TABLE "FreelancerSkill" ALTER COLUMN "skillName" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "FreelancerSkill_skillName_idx" ON "FreelancerSkill"("skillName");
