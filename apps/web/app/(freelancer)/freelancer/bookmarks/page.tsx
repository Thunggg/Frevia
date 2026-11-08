import { getTranslations } from "next-intl/server";
import jobServerRequest from "@/apiRequests/job.server";
import type { JobStatusType } from "@shared/types";
import { BookmarksContent } from "../../bookmarks/bookmarks-content";

type BookmarksPageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    order?: string;
  }>;
};

export async function generateMetadata() {
  const t = await getTranslations("pageMeta");

  return {
    title: t("bookmarksTitle"),
    description: t("bookmarksDescription"),
  };
}

const VALID_STATUSES = [
  "OPEN",
  "CLOSED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export default async function FreelancerBookmarksPage({
  searchParams,
}: BookmarksPageProps) {
  const params = await searchParams;
  const parsedPage = Number(params.page);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const parsedLimit = Number(params.limit);
  const limit = [5, 10, 20].includes(parsedLimit) ? parsedLimit : 10;
  const search = params.search?.trim() || undefined;
  const status =
    params.status &&
    (VALID_STATUSES as readonly string[]).includes(params.status)
      ? (params.status as JobStatusType)
      : undefined;
  const order = params.order === "asc" ? "asc" : "desc";

  const result = await jobServerRequest.getBookmarkedJobs({
    page,
    limit,
    search,
    status,
    sortBy: "createdAt",
    order,
  });

  return (
    <BookmarksContent
      initialJobs={result?.data ?? []}
      pagination={
        result?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 }
      }
      embedded={true}
      basePath="/freelancer/bookmarks"
      initialSearch={search ?? ""}
      initialStatus={params.status ?? "all"}
      initialOrder={order}
      initialLimit={limit}
    />
  );
}
