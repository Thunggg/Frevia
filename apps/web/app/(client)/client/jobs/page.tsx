import type { JobStatusType } from "@shared/types";
import jobServerRequest from "@/apiRequests/job.server";

import { JobList } from "./_components/job-list";

export default async function ClientJobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
  }>;
}) {
  const { page: pageParam, limit: limitParam, search, status } = await searchParams;
  const parsedPage = Number(pageParam);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedLimit = Number(limitParam);
  const limit = [10, 20].includes(parsedLimit) ? parsedLimit : 10;

  const validStatuses: JobStatusType[] = [
    "DRAFT",
    "OPEN",
    "IN_PROGRESS",
    "COMPLETED",
    "CLOSED",
    "EXPIRED",
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
    expiredResult,
  ] = await Promise.all([
    jobServerRequest.getClientJobs({
      page,
      limit,
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
    jobServerRequest.getClientJobs({ status: "EXPIRED", limit: 1 }).catch(() => null),
  ]);

  return (
    <JobList
      initialJobs={result?.data ?? []}
      pagination={
        result?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 }
      }
      overviewCounts={{
        open: openResult?.pagination?.total ?? 0,
        inProgress: inProgressResult?.pagination?.total ?? 0,
        completed: completedResult?.pagination?.total ?? 0,
        draft: draftResult?.pagination?.total ?? 0,
        expired: expiredResult?.pagination?.total ?? 0,
      }}
      initialSearch={search?.trim() || ""}
      initialStatus={parsedStatus}
    />
  );
}
