import authServerRequest from "@/apiRequests/auth.server";
import jobServerRequest from "@/apiRequests/job.server";
import savedSearchServerRequest from "@/apiRequests/saved-search.server";
import type { UserRole } from "@/components/header";
import { RoleName, type SavedSearchType } from "@shared/types";

import { FindWorkContent } from "./find-work-content";

type FindWorkSearchParams = Promise<{
  keyword?: string;
  page?: string;
  budget?: string;
  time?: string;
  sort?: string;
}>;

type FindWorkPageProps = {
  searchParams: FindWorkSearchParams;
};

function resolveHeaderRole(
  user: Awaited<ReturnType<typeof authServerRequest.getMe>>,
): UserRole {
  if (!user) return "GUEST";

  const primaryRole =
    user.roles.find((role) => role.isPrimary) ?? user.roles[0];

  if (primaryRole?.name === RoleName.CLIENT) return "CLIENT";
  if (primaryRole?.name === RoleName.FREELANCER) return "FREELANCER";

  return "FREELANCER";
}

export default async function FindWorkPage({ searchParams }: FindWorkPageProps) {
  const params = await searchParams;
  const parsedPage = Number(params.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
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

  const [user, result] = await Promise.all([
    authServerRequest.getMe(),
    jobServerRequest.getJobs({
      page,
      limit: 10,
      search: keyword,
      ...budgetRanges[budget],
      createdAfter,
      ...selectedSort,
    }),
  ]);

  const role = resolveHeaderRole(user);
  const jobs = result?.data ?? [];
  const pagination = result
    ? result.pagination
    : { page: 1, limit: 10, total: 0, totalPages: 0 };

  let initialBookmarkedSlugs: string[] = [];
  let initialSavedSearches: SavedSearchType[] = [];
  if (role === "FREELANCER" && jobs.length > 0) {
    const statuses = await Promise.all(
      jobs.map(async (job) => {
        const status = await jobServerRequest.getBookmarkStatus(job.slug);
        return status?.isBookmarked ? job.slug : null;
      }),
    );
    initialBookmarkedSlugs = statuses.filter(
      (slug): slug is string => Boolean(slug),
    );
  }

  if (role === "FREELANCER") {
    initialSavedSearches = (await savedSearchServerRequest.getSavedSearches()) ?? [];
  }

  return (
    <FindWorkContent
      role={role}
      initialJobs={jobs}
      initialPagination={pagination}
      initialKeyword={keyword ?? ""}
      initialBudget={budgetRanges[budget] ? budget : "all"}
      initialTime={timeRange ? time : "all"}
      initialSort={
        sortOptions[sort as keyof typeof sortOptions] ? sort : "newest"
      }
      initialBookmarkedSlugs={initialBookmarkedSlugs}
      initialSavedSearches={initialSavedSearches}
    />
  );
}
