import { getBookmarkedJobsServer } from "@/lib/get-job";
import { BookmarksContent } from "./bookmarks-content";

type BookmarksPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function BookmarksPage({
  searchParams,
}: BookmarksPageProps) {
  const { page: pageParam } = await searchParams;
  const parsedPage = Number(pageParam);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const result = await getBookmarkedJobsServer({ page, limit: 10 });
  // console.log("result", result);
  return (
    <BookmarksContent
      initialJobs={result?.data ?? []}
      pagination={
        result?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }
      }
    />
  );
}
