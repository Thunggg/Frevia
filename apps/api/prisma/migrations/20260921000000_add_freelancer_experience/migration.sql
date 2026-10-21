-- Thêm cột FreelancerProfile.experience (scalar list String[]).
-- Lưu dạng danh sách chuỗi giống education/certifications/languages.
ALTER TABLE "FreelancerProfile"
  ADD COLUMN "experience" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];