-- DB cho luồng phân tích CV (service AI `frevia-ai`) + các mục hồ sơ có cấu trúc.
--
-- 1) Enum: CvAnalysisStatus, CvSourceType, ProfileContentSource.
-- 2) Bảng "CvAnalysis": lưu bản nháp kết quả phân tích (payload + meta + trạng thái
--    xác nhận) để người dùng xem/sửa/xác nhận mà không phải gọi lại LLM.
--    Đây KHÔNG phải hồ sơ — chỉ ghi vào hồ sơ khi người dùng xác nhận.
-- 3) Bảng "FreelancerExperience" / "FreelancerEducation": dữ liệu CV có cấu trúc
--    (title/company/thời gian, degree/school/năm) thay cho text tự do.
-- 4) "PortfolioItem"."source": đánh dấu mục portfolio nhập từ CV.
--
-- Lưu ý: KHÔNG backfill từ "FreelancerProfile"."experience"/"education" (String[])
-- để tránh hai nguồn dữ liệu trùng nhau. Hai cột cũ giữ nguyên cho tới khi API/UI
-- chuyển hẳn sang bảng mới, sau đó có thể xoá bằng migration riêng.

-- CreateEnum
CREATE TYPE "CvAnalysisStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DISCARDED');
CREATE TYPE "CvSourceType" AS ENUM ('PDF_TEXT', 'PDF_OCR', 'DOCX', 'DOC');
CREATE TYPE "ProfileContentSource" AS ENUM ('MANUAL', 'CV_IMPORT');

-- AlterTable
ALTER TABLE "PortfolioItem" ADD COLUMN "source" "ProfileContentSource" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "CvAnalysis" (
    "id" SERIAL NOT NULL,
    "freelancerProfileId" INTEGER NOT NULL,
    "status" "CvAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "cvUrl" VARCHAR(500),
    "cvFileName" VARCHAR(255),
    "cvUploadedAt" TIMESTAMP(3),
    "source" "CvSourceType" NOT NULL,
    "pages" INTEGER NOT NULL DEFAULT 0,
    "chars" INTEGER NOT NULL DEFAULT 0,
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "ocrUsed" BOOLEAN NOT NULL DEFAULT false,
    "model" VARCHAR(100),
    "durationMs" INTEGER,
    "warnings" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "payload" JSONB NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "discardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CvAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreelancerExperience" (
    "id" SERIAL NOT NULL,
    "freelancerProfileId" INTEGER NOT NULL,
    "title" VARCHAR(150),
    "company" VARCHAR(150),
    "startDate" VARCHAR(10),
    "endDate" VARCHAR(10),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "source" "ProfileContentSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FreelancerExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreelancerEducation" (
    "id" SERIAL NOT NULL,
    "freelancerProfileId" INTEGER NOT NULL,
    "degree" VARCHAR(150),
    "school" VARCHAR(150),
    "startYear" INTEGER,
    "endYear" INTEGER,
    "description" TEXT,
    "source" "ProfileContentSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FreelancerEducation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CvAnalysis_freelancerProfileId_status_createdAt_idx" ON "CvAnalysis"("freelancerProfileId", "status", "createdAt");
CREATE INDEX "CvAnalysis_status_idx" ON "CvAnalysis"("status");
CREATE INDEX "FreelancerExperience_freelancerProfileId_deletedAt_idx" ON "FreelancerExperience"("freelancerProfileId", "deletedAt");
CREATE INDEX "FreelancerEducation_freelancerProfileId_deletedAt_idx" ON "FreelancerEducation"("freelancerProfileId", "deletedAt");

-- AddForeignKey
ALTER TABLE "CvAnalysis" ADD CONSTRAINT "CvAnalysis_freelancerProfileId_fkey" FOREIGN KEY ("freelancerProfileId") REFERENCES "FreelancerProfile"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "FreelancerExperience" ADD CONSTRAINT "FreelancerExperience_freelancerProfileId_fkey" FOREIGN KEY ("freelancerProfileId") REFERENCES "FreelancerProfile"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "FreelancerEducation" ADD CONSTRAINT "FreelancerEducation_freelancerProfileId_fkey" FOREIGN KEY ("freelancerProfileId") REFERENCES "FreelancerProfile"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
