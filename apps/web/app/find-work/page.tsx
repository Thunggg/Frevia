import jobServerRequest from "@/apiRequests/job.server";
import jobCategoryServerRequest from "@/apiRequests/job-category.server";
import { FindWorkGuestView } from "./find-work-guest-view";
import type { ViewListJobFilterType } from "@shared/types";

type FindWorkPageProps = {
  searchParams: Promise<{
    keyword?: string;
    category?: string;
    budget?: string;
    sort?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function FindWorkPage({
  searchParams,
}: FindWorkPageProps) {
  const params = await searchParams;

  const keyword = params.keyword?.trim() || undefined;
  const category = params.category?.trim() || undefined;
  const budget = params.budget?.trim() || "";
  const sort = params.sort?.trim() || "newest";
  const parsedPage = Number(params.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedLimit = Number(params.limit);
  const limit = [10, 20].includes(parsedLimit) ? parsedLimit : 10;

  // Xây dựng query params gửi tới backend
  const filter: ViewListJobFilterType = {
    page,
    limit,
    search: keyword,
    category,
  };

  // Map budget (USD)
  if (budget === "under-100") {
    filter.budgetMax = 100;
  } else if (budget === "100-500") {
    filter.budgetMin = 100;
    filter.budgetMax = 500;
  } else if (budget === "500-2000") {
    filter.budgetMin = 500;
    filter.budgetMax = 2000;
  } else if (budget === "over-2000") {
    filter.budgetMin = 2000;
  }

  // Map sort
  if (sort === "oldest") {
    filter.sortBy = "createdAt";
    filter.order = "asc";
  } else if (sort === "budget-high") {
    filter.sortBy = "budgetMax";
    filter.order = "desc";
  } else if (sort === "budget-low") {
    filter.sortBy = "budgetMin";
    filter.order = "asc";
  } else {
    filter.sortBy = "createdAt";
    filter.order = "desc";
  }

  const [jobResponse, categoriesResponse] = await Promise.all([
    jobServerRequest.getJobs(filter),
    jobCategoryServerRequest.getJobCategories({ limit: 50 }),
  ]);

  const categories = categoriesResponse?.jobCategories ?? [];

  return (
    <FindWorkGuestView
      initialData={jobResponse}
      categories={categories}
      currentKeyword={keyword ?? ""}
      currentCategory={category ?? ""}
      currentBudget={budget}
      currentSort={sort}
      currentPage={page}
    />
  );
}
