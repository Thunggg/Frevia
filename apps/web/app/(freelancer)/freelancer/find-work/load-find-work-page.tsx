import authServerRequest from "@/apiRequests/auth.server";
import jobServerRequest from "@/apiRequests/job.server";
import jobCategoryServerRequest from "@/apiRequests/job-category.server";
import recommendationServerRequest from "@/apiRequests/recommendation.server";
import savedSearchServerRequest from "@/apiRequests/saved-search.server";
import jobAlertServerRequest from "@/apiRequests/job-alert.server";
import type {
  JobAlertType,
  RecommendedJobType,
  SavedSearchType,
  ViewJobDetailResType,
} from "@shared/types";
import { redirect } from "next/navigation";
import { FindWorkContent, type HomeTab } from "./find-work-content";

export type FindWorkSearchParams = Promise<{
  keyword?: string;
  category?: string;
  page?: string;
  limit?: string;
  budget?: string;
  budgetType?: "FIXED_PRICE";
  proposals?: string;
  verified?: string;
  time?: string;
  sort?: string;
  tab?: string;
}>;

export async function renderFindWorkPage({
  searchParams,
  tab,
  basePath = "/freelancer/find-work",
}: {
  searchParams: FindWorkSearchParams;
  tab?: HomeTab;
  basePath?: string;
}) {
  const user = await authServerRequest.getMe();
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent("/freelancer/find-work/best-matches")}`);
  }

  const params = await searchParams;
  const parsedPage = Number(params.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedLimit = Number(params.limit);
  const limit = [10, 20, 50].includes(parsedLimit) ? parsedLimit : 10;
  const keyword = params.keyword?.trim() || undefined;
  const budget = params.budget ?? "all";
  const time = params.time ?? "all";
  const sort = params.sort ?? "newest";

  const sortOptions = {
    newest: { sortBy: "createdAt", order: "desc" },
    oldest: { sortBy: "createdAt", order: "asc" },
    "title-asc": { sortBy: "title", order: "asc" },
    "title-desc": { sortBy: "title", order: "desc" },
    "budget-low": { sortBy: "budgetMin", order: "asc" },
    "budget-high": { sortBy: "budgetMax", order: "desc" },
  } as const;
  const selectedSort =
    sortOptions[sort as keyof typeof sortOptions] ?? sortOptions.newest;

  const budgetRanges: Record<
    string,
    { budgetMin?: number; budgetMax?: number }
  > = {
    "under-500": { budgetMax: 500 },
    "500-1000": { budgetMin: 500, budgetMax: 1000 },
    "1000-5000": { budgetMin: 1000, budgetMax: 5000 },
    "5000-plus": { budgetMin: 5000 },
  };
  const timeRanges: Record<string, number> = {
    today: 1,
    "last-3-days": 3,
    "last-7-days": 7,
    "last-30-days": 30,
  };
  const timeRange = timeRanges[time];
  const createdAfter = timeRange
    ? new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)
    : undefined;

  const categoriesResult = await jobCategoryServerRequest.getJobCategories({
    limit: 50,
  });
  const jobCategories = categoriesResult?.jobCategories ?? [];
  const category = jobCategories.some((item) => item.slug === params.category)
    ? params.category
    : undefined;

  const budgetType =
    params.budgetType === "FIXED_PRICE" ? "FIXED_PRICE" : undefined;

  const result = await jobServerRequest.getJobs({
    page,
    limit,
    search: keyword,
    category,
    budgetType,
    ...budgetRanges[budget],
    createdAfter,
    ...selectedSort,
  });

  const jobs = result?.data ?? [];
  const pagination = result
    ? result.pagination
    : { page: 1, limit, total: 0, totalPages: 0 };

  let initialBookmarkedJobs: ViewJobDetailResType[] = [];
  let initialBookmarkedSlugs: string[] = [];
  let initialSavedSearches: SavedSearchType[] = [];
  let initialRecommendedJobs: RecommendedJobType[] = [];
  let initialJobAlerts: JobAlertType[] = [];

  const [
    bookmarkedJobsRes,
    savedSearchesRes,
    recommendationsRes,
    jobAlertsRes,
  ] = await Promise.allSettled([
    jobServerRequest.getBookmarkedJobs({ limit: 20 }),
    savedSearchServerRequest.getSavedSearches(),
    recommendationServerRequest.getRecommendedJobs(15),
    jobAlertServerRequest.getJobAlerts(),
  ]);

  if (bookmarkedJobsRes.status === "fulfilled" && bookmarkedJobsRes.value?.data) {
    initialBookmarkedJobs = bookmarkedJobsRes.value.data;
    initialBookmarkedSlugs = initialBookmarkedJobs.map((item) => item.slug);
  }

  if (savedSearchesRes.status === "fulfilled") {
    initialSavedSearches = savedSearchesRes.value ?? [];
  }

  if (recommendationsRes.status === "fulfilled" && recommendationsRes.value) {
    initialRecommendedJobs = recommendationsRes.value.data ?? [];
  }

  if (jobAlertsRes.status === "fulfilled" && jobAlertsRes.value) {
    initialJobAlerts = jobAlertsRes.value ?? [];
  }

  return (
    <FindWorkContent
      role="FREELANCER"
      user={user}
      initialJobs={jobs}
      initialPagination={pagination}
      initialKeyword={keyword ?? ""}
      initialCategory={category ?? "all"}
      initialCategories={jobCategories}
      initialBudget={budgetRanges[budget] ? budget : "all"}
      initialTime={timeRange ? time : "all"}
      initialSort={
        sortOptions[sort as keyof typeof sortOptions] ? sort : "newest"
      }
      initialBookmarkedSlugs={initialBookmarkedSlugs}
      initialBookmarkedJobs={initialBookmarkedJobs}
      initialSavedSearches={initialSavedSearches}
      initialRecommendedJobs={initialRecommendedJobs}
      initialJobAlerts={initialJobAlerts}
      embedded={true}
      basePath={basePath}
      initialTab={tab}
    />
  );
}

