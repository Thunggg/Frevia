import type { Metadata } from "next";
import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import jobServerRequest from "@/apiRequests/job.server";
import jobCategoryServerRequest from "@/apiRequests/job-category.server";
import savedSearchServerRequest from "@/apiRequests/saved-search.server";
import type {
  JobBudgetType,
  JobCategoryBrowseItemType,
  JobHiringType,
  JobType,
  SavedSearchType,
  ViewJobDetailResType,
} from "@shared/types";
import { SearchJobsContent } from "./search-jobs-content";

export const metadata: Metadata = {
  title: "Tìm kiếm công việc | Frevia",
  description: "Tìm kiếm và lọc các cơ hội việc làm tự do phù hợp với kỹ năng và kinh nghiệm của bạn.",
};

type SearchJobsPageProps = {
  searchParams: Promise<{
    q?: string;
    keyword?: string;
    category?: string;
    budget?: string;
    budgetMin?: string;
    budgetMax?: string;
    time?: string;
    hiringType?: string;
    skill?: string;
    sort?: string;
    page?: string;
    limit?: string;
  }>;
};

export default async function FreelancerSearchJobsPage({
  searchParams,
}: SearchJobsPageProps) {
  const user = await authServerRequest.getMe();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent("/freelancer/search/jobs")}`,
    );
  }

  const params = await searchParams;
  const q = params.q?.trim() || params.keyword?.trim() || undefined;

  const parsedPage = Number(params.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedLimit = Number(params.limit);
  const limit = [10, 20].includes(parsedLimit) ? parsedLimit : 10;

  const budget = params.budget ?? "all";
  const time = params.time ?? "all";
  const sort = params.sort ?? "newest";
  const skill = params.skill?.trim() || undefined;
  const hiringType = ["SINGLE", "MULTIPLE"].includes(params.hiringType ?? "")
    ? (params.hiringType as JobHiringType)
    : undefined;

  const sortOptions = {
    newest: { sortBy: "createdAt", order: "desc" },
    oldest: { sortBy: "createdAt", order: "asc" },
    "budget-high": { sortBy: "budgetMax", order: "desc" },
    "budget-low": { sortBy: "budgetMin", order: "asc" },
    "title-asc": { sortBy: "title", order: "asc" },
    deadline: { sortBy: "deadline", order: "asc" },
  } as const;
  const selectedSort =
    sortOptions[sort as keyof typeof sortOptions] ?? sortOptions.newest;

  const budgetPresets: Record<
    string,
    { budgetMin?: number; budgetMax?: number }
  > = {
    "under-100": { budgetMax: 100 },
    "100-500": { budgetMin: 100, budgetMax: 500 },
    "500-1000": { budgetMin: 500, budgetMax: 1000 },
    "1000-5000": { budgetMin: 1000, budgetMax: 5000 },
    "5000-plus": { budgetMin: 5000 },
  };

  const parsedMin = params.budgetMin ? Number(params.budgetMin) : undefined;
  const parsedMax = params.budgetMax ? Number(params.budgetMax) : undefined;
  const customBudget = {
    budgetMin: Number.isFinite(parsedMin) ? parsedMin : undefined,
    budgetMax: Number.isFinite(parsedMax) ? parsedMax : undefined,
  };
  const activeBudgetRange =
    customBudget.budgetMin !== undefined || customBudget.budgetMax !== undefined
      ? customBudget
      : budgetPresets[budget] ?? {};

  const timeRanges: Record<string, number> = {
    today: 1,
    "last-3-days": 3,
    "last-7-days": 7,
    "last-30-days": 30,
  };
  const daysAgo = timeRanges[time];
  const createdAfter = daysAgo
    ? new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
    : undefined;

  // Real categories from DB
  const categoriesResult = await jobCategoryServerRequest.getJobCategories({
    limit: 50,
  });
  const categories: JobCategoryBrowseItemType[] =
    categoriesResult?.jobCategories ?? [];

  const category = categories.some((item) => item.slug === params.category)
    ? params.category
    : undefined;

  // Fetch jobs according to real schema fields
  const jobsResult = await jobServerRequest.getJobs({
    page,
    limit,
    search: q,
    category,
    skill,
    hiringType,
    ...activeBudgetRange,
    createdAfter,
    ...selectedSort,
  });

  const jobs: JobType[] = jobsResult?.data ?? [];
  const pagination = jobsResult?.pagination ?? {
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
  };

  // Fetch saved searches and bookmarks
  let initialBookmarkedJobs: ViewJobDetailResType[] = [];
  let initialBookmarkedSlugs: string[] = [];
  let initialSavedSearches: SavedSearchType[] = [];

  const [bookmarkedRes, savedSearchesRes] = await Promise.allSettled([
    jobServerRequest.getBookmarkedJobs({ limit: 20 }),
    savedSearchServerRequest.getSavedSearches(),
  ]);

  if (bookmarkedRes.status === "fulfilled" && bookmarkedRes.value?.data) {
    initialBookmarkedJobs = bookmarkedRes.value.data;
    initialBookmarkedSlugs = initialBookmarkedJobs.map((j) => j.slug);
  }

  if (savedSearchesRes.status === "fulfilled") {
    initialSavedSearches = savedSearchesRes.value ?? [];
  }

  return (
    <SearchJobsContent
      user={user}
      initialJobs={jobs}
      initialPagination={pagination}
      initialCategories={categories}
      initialBookmarkedSlugs={initialBookmarkedSlugs}
      initialBookmarkedJobs={initialBookmarkedJobs}
      initialSavedSearches={initialSavedSearches}
      initialQ={q ?? ""}
      initialCategory={params.category ?? "all"}
      initialBudget={params.budget ?? "all"}
      initialBudgetMin={params.budgetMin ?? ""}
      initialBudgetMax={params.budgetMax ?? ""}
      initialTime={params.time ?? "all"}
      initialHiringType={params.hiringType ?? "all"}
      initialSkill={params.skill ?? ""}
      initialSort={sort}
    />
  );
}

