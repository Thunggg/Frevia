import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";

import jobCategoryServerRequest from "@/apiRequests/job-category.server";
import { Button } from "@repo/ui/components/shadcn/button";

import { CategoryListContent } from "./_components/category-list-content";

type CategoriesSearchParams = Promise<{
  search?: string;
  page?: string;
}>;

type CategoriesPageProps = {
  searchParams: CategoriesSearchParams;
};

const CATEGORY_PAGE_SIZE = 12;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jobCategories");

  return {
    title: t("metaTitle"),
    description: t("listSubtitle"),
  };
}

// UC-46.06 — View Job Category List (Freelancer).
export default async function FreelancerCategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const params = await searchParams;
  const parsedPage = Number(params.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const search = params.search?.trim() || undefined;
  const t = await getTranslations("jobCategories");

  const result = await jobCategoryServerRequest.getJobCategories({
    page,
    limit: CATEGORY_PAGE_SIZE,
    search,
  });

  // EX-01: không tải được danh mục (lỗi hệ thống/kết nối).
  if (!result) {
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
            <Link href="/freelancer/categories">{t("tryAgain")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CategoryListContent
      initialCategories={result.jobCategories}
      initialPagination={result.pagination}
      initialSearch={search ?? ""}
    />
  );
}
