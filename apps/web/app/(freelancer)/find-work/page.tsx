import { getJobsServer } from "@/lib/get-job";
import { FindWorkContent } from "./find-work-content";

type FindWorkSearchParams = Promise<{
  keyword?: string;
  page?: string;
  budget?: string;
  time?: string;
}>;

type FindWorkPageProps = {
  searchParams: FindWorkSearchParams;
};

export default async function FindWorkPage({ searchParams }: FindWorkPageProps) {
  const params = await searchParams;
  const parsedPage = Number(params.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const keyword = params.keyword?.trim() || undefined;
  const budget = params.budget ?? "all";
  const time = params.time ?? "all";

  const budgetRanges: Record<string, { budgetMin?: number; budgetMax?: number }> = {
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

  const result = await getJobsServer({
    page,
    limit: 10,
    search: keyword,
    ...budgetRanges[budget],
    createdAfter,
  });

  const jobs = result?.data ?? [];
  const pagination = result
    ? result.pagination
    : { page: 1, limit: 10, total: 0, totalPages: 0 };

  return (
    <FindWorkContent
      initialJobs={jobs}
      initialPagination={pagination}
      initialKeyword={keyword ?? ""}
      initialBudget={budgetRanges[budget] ? budget : "all"}
      initialTime={timeRange ? time : "all"}
    />
  );
}
