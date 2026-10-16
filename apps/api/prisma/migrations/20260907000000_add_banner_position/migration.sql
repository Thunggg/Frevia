-- CreateEnum
CREATE TYPE "BannerPosition" AS ENUM ('GLOBAL_HEADER', 'HOME_HERO', 'HOME_BODY', 'SEARCH_RESULTS', 'FOOTER');

-- AlterTable
ALTER TABLE "AdvertisementBanner" ADD COLUMN     "position" "BannerPosition" NOT NULL DEFAULT 'GLOBAL_HEADER';

-- CreateIndex
CREATE INDEX "AdvertisementBanner_position_startDate_endDate_idx" ON "AdvertisementBanner"("position", "startDate", "endDate");
