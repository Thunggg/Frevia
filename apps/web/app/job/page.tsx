import jobServerRequest from "@/apiRequests/job.server";
import jobCategoryServerRequest from "@/apiRequests/job-category.server";
import { FindWorkGuestView } from "./find-work-guest-view";
import type { ViewListJobFilterType } from "@shared/types";

type JobPageProps = {
  searchParams: Promise<{
    keyword?: string;
    category?: string;
    budget?: string;
    sort?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function JobPage({
  searchParams,
}: JobPageProps) {
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

  // Map budget
  if (budget === "under-500" || budget === "under-5m") {
    filter.budgetMax = 500;
  } else if (budget === "500-1000" || budget === "5m-20m") {
    filter.budgetMin = 500;
    filter.budgetMax = 1000;
  } else if (budget === "1000-5000" || budget === "20m-50m") {
    filter.budgetMin = 1000;
    filter.budgetMax = 5000;
  } else if (budget === "5000-plus" || budget === "over-50m") {
    filter.budgetMin = 5000;
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
