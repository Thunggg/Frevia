import jobServerRequest from "@/apiRequests/job.server";

import { JobList } from "./_components/job-list";

export default async function ClientJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const parsedPage = Number(pageParam);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const result = await jobServerRequest.getClientJobs({ page, limit: 10 });

  return (
    <JobList
      initialJobs={result?.data ?? []}
      pagination={
        result?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }
      }
    />
  );
}
