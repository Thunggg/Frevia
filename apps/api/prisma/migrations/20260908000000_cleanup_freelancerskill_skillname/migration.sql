-- Cột skillName (free-text) của FreelancerSkill còn sót lại từ migration
-- 20260906000000_normalize_skill_model (áp dụng bị gián đoạn: 2 record trong _prisma_migrations,
-- record đầu finished_at = null). SkillName đã thay bằng FK skillId trong schema hiện tại,
-- nhưng cột cũ vẫn còn (NOT NULL) khiến mọi INSERT qua Prisma bị lỗi 23502.
-- Migration này chỉ dọn phần còn thiếu, dùng IF EXISTS để idempotent.
DROP INDEX IF EXISTS "FreelancerSkill_skillName_idx";
ALTER TABLE "FreelancerSkill" DROP COLUMN IF EXISTS "skillName";