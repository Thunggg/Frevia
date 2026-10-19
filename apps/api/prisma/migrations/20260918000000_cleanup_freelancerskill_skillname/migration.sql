-- Cột skillName (free-text) của FreelancerSkill là di sót: migration
-- 20260906143000_add_freelancer_skill_name_column được áp dụng SAU khi đã chạy
-- 20260908000000_cleanup_freelancerskill_skillname (thứ tự thư mục bị lệch),
-- nên cột NOT NULL vẫn tồn tại trong DB. Schema Prisma hiện tại dùng FK skillId,
-- không có skillName nên mọi INSERT qua Prisma đều lỗi 23502 (Null constraint
-- violation). Migration này drop cột và index để khớp schema. Dùng IF EXISTS để idempotent.
DROP INDEX IF EXISTS "FreelancerSkill_skillName_idx";
ALTER TABLE "FreelancerSkill" DROP COLUMN IF EXISTS "skillName";