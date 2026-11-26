import type { JobStatusType } from "@shared/types";
import jobServerRequest from "@/apiRequests/job.server";

import { JobList } from "./_components/job-list";

export default async function ClientJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const { page: pageParam, search, status } = await searchParams;
  const parsedPage = Number(pageParam);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const validStatuses: JobStatusType[] = [
    "DRAFT",
    "OPEN",
    "IN_PROGRESS",
    "COMPLETED",
    "CLOSED",
    "CANCELLED",
  ];
  const parsedStatus =
    status && validStatuses.includes(status as JobStatusType)
      ? (status as JobStatusType)
      : undefined;

  const [
    result,
    openResult,
    inProgressResult,
    completedResult,
    draftResult,
  ] = await Promise.all([
    jobServerRequest.getClientJobs({
      page,
      limit: 10,
      search: search?.trim() || undefined,
      status: parsedStatus,
    }),
    jobServerRequest.getClientJobs({ status: "OPEN", limit: 1 }).catch(() => null),
    jobServerRequest
      .getClientJobs({ status: "IN_PROGRESS", limit: 1 })
      .catch(() => null),
    jobServerRequest
      .getClientJobs({ status: "COMPLETED", limit: 1 })
      .catch(() => null),
    jobServerRequest.getClientJobs({ status: "DRAFT", limit: 1 }).catch(() => null),
  ]);

  return (
    <JobList
      initialJobs={result?.data ?? []}
      pagination={
        result?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }
      }
      overviewCounts={{
        open: openResult?.pagination?.total ?? 0,
        inProgress: inProgressResult?.pagination?.total ?? 0,
        completed: completedResult?.pagination?.total ?? 0,
        draft: draftResult?.pagination?.total ?? 0,
      }}
      initialSearch={search?.trim() || ""}
      initialStatus={parsedStatus}
    />
  );
}
