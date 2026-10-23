import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import jobCategoryServerRequest from "@/apiRequests/job-category.server";
import { Button } from "@repo/ui/components/shadcn/button";

import { CategoryDetailContent } from "../_components/category-detail-content";

type CategoryDetailParams = Promise<{ slug: string }>;

type CategoryDetailSearchParams = Promise<{ page?: string }>;

type CategoryDetailPageProps = {
  params: CategoryDetailParams;
  searchParams: CategoryDetailSearchParams;
};

const CATEGORY_JOB_PAGE_SIZE = 10;

export async function generateMetadata({
  params,
}: CategoryDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: jobCategory } =
    await jobCategoryServerRequest.getJobCategoryDetail(slug);

  if (!jobCategory) {
    return {};
  }

  return {
    title: jobCategory.name,
    description: jobCategory.description ?? undefined,
  };
}

// UC-46.07 — View Job Category Detail (Freelancer).
export default async function FreelancerCategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const parsedPage = Number(query.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const t = await getTranslations("jobCategories");

  const { data: jobCategory, status } =
    await jobCategoryServerRequest.getJobCategoryDetail(slug, {
      page,
      limit: CATEGORY_JOB_PAGE_SIZE,
    });

  // EX-01: danh mục không tồn tại (hoặc đã bị xoá/vô hiệu hoá).
  if (!jobCategory && status === 404) {
    notFound();
  }

  // EX-02: không tải được chi tiết do lỗi hệ thống.
  if (!jobCategory) {
    return (
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-16 font-sans">
        <div className="w-full max-w-md rounded-[28px] border border-border bg-card p-8 text-center">
          <h1 className="text-base font-semibold text-foreground">
            {t("loadFailedTitle")}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("loadFailedDescription")}
          </p>
          <Button asChild variant="outline" className="mt-5 rounded-full text-xs">
            <Link href="/freelancer/categories">{t("backToCategories")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <CategoryDetailContent jobCategory={jobCategory} />;
}
