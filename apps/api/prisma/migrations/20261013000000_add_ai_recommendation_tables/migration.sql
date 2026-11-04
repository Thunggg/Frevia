-- Nền tảng dữ liệu cho pipeline AI Job-CV Recommendation (plan.cv.md §11.2).
--
-- 1) Enum điều phối: AiDocumentType, AiProcessingStatus, EmbeddingIndexStatus,
--    OutboxEventType, OutboxEventStatus, RecommendationFeedbackType.
-- 2) "DocumentProcessingJob": trạng thái ingestion/embedding của một tài liệu CV/JD.
-- 3) "EmbeddingIndexRecord": theo dõi đồng bộ từng vector (mỗi section + full-text) với ChromaDB.
-- 4) "Recommendation": lịch sử kết quả recommendation.
-- 5) "RecommendationFeedback": phản hồi người dùng (VIEW/SAVE/APPLY/...).
-- 6) "EmbeddingOutboxEvent": transactional outbox đồng bộ vector.
--
-- Lưu ý: "documentId"/"sourceDocumentId"/"targetDocumentId" là polymorphic
-- (FreelancerProfile.id cho CV, Job.id cho JD) nên KHÔNG có khoá ngoại.
-- Enum AiDocumentType đặt tên khác DocumentType (đang dùng cho ID verification).

-- CreateEnum
CREATE TYPE "AiDocumentType" AS ENUM ('CV', 'JOB');

-- CreateEnum
CREATE TYPE "AiProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "EmbeddingIndexStatus" AS ENUM ('PENDING', 'INDEXED', 'STALE', 'FAILED');

-- CreateEnum
CREATE TYPE "OutboxEventType" AS ENUM ('UPSERT', 'DELETE');

-- CreateEnum
CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "RecommendationFeedbackType" AS ENUM ('VIEW', 'SAVE', 'APPLY', 'DISMISS', 'SHORTLIST', 'HIRE');

-- CreateTable
CREATE TABLE "DocumentProcessingJob" (
    "id" SERIAL NOT NULL,
    "documentType" "AiDocumentType" NOT NULL,
    "documentId" INTEGER NOT NULL,
    "documentVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "AiProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbeddingIndexRecord" (
    "id" SERIAL NOT NULL,
    "documentType" "AiDocumentType" NOT NULL,
    "documentId" INTEGER NOT NULL,
    "documentVersion" INTEGER NOT NULL DEFAULT 1,
    "section" VARCHAR(50) NOT NULL DEFAULT '_full',
    "embeddingModel" VARCHAR(100) NOT NULL,
    "collectionName" VARCHAR(100) NOT NULL,
    "vectorRecordId" VARCHAR(255) NOT NULL,
    "contentHash" VARCHAR(64) NOT NULL,
    "indexStatus" "EmbeddingIndexStatus" NOT NULL DEFAULT 'PENDING',
    "indexedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbeddingIndexRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" SERIAL NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "sourceType" "AiDocumentType" NOT NULL,
    "sourceDocumentId" INTEGER NOT NULL,
    "targetType" "AiDocumentType" NOT NULL,
    "targetDocumentId" INTEGER NOT NULL,
    "semanticScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "skillScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "experienceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budgetScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "preferenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "finalScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rankingVersion" VARCHAR(50) NOT NULL,
    "embeddingModel" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationFeedback" (
    "id" SERIAL NOT NULL,
    "recommendationId" INTEGER NOT NULL,
    "type" "RecommendationFeedbackType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbeddingOutboxEvent" (
    "id" SERIAL NOT NULL,
    "eventType" "OutboxEventType" NOT NULL,
    "documentType" "AiDocumentType" NOT NULL,
    "documentId" INTEGER NOT NULL,
    "documentVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "EmbeddingOutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentProcessingJob_documentType_documentId_idx" ON "DocumentProcessingJob"("documentType", "documentId");

-- CreateIndex
CREATE INDEX "DocumentProcessingJob_status_createdAt_idx" ON "DocumentProcessingJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmbeddingIndexRecord_documentType_documentId_documentVersio_idx" ON "EmbeddingIndexRecord"("documentType", "documentId", "documentVersion");

-- CreateIndex
CREATE INDEX "EmbeddingIndexRecord_indexStatus_idx" ON "EmbeddingIndexRecord"("indexStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EmbeddingIndexRecord_vectorRecordId_key" ON "EmbeddingIndexRecord"("vectorRecordId");

-- CreateIndex
CREATE INDEX "Recommendation_requesterId_sourceType_sourceDocumentId_crea_idx" ON "Recommendation"("requesterId", "sourceType", "sourceDocumentId", "createdAt");

-- CreateIndex
CREATE INDEX "Recommendation_targetType_targetDocumentId_idx" ON "Recommendation"("targetType", "targetDocumentId");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_recommendationId_idx" ON "RecommendationFeedback"("recommendationId");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_type_createdAt_idx" ON "RecommendationFeedback"("type", "createdAt");

-- CreateIndex
CREATE INDEX "EmbeddingOutboxEvent_status_createdAt_idx" ON "EmbeddingOutboxEvent"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmbeddingOutboxEvent_documentType_documentId_idx" ON "EmbeddingOutboxEvent"("documentType", "documentId");

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RecommendationFeedback" ADD CONSTRAINT "RecommendationFeedback_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
