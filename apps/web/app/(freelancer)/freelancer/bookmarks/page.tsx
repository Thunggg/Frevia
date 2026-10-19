import jobServerRequest from "@/apiRequests/job.server";
import { BookmarksContent } from "../../bookmarks/bookmarks-content";

type BookmarksPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export const metadata = {
  title: "Saved Jobs | Freelancer Dashboard | Frevia",
  description: "View all your bookmarked and saved jobs.",
};

export default async function FreelancerBookmarksPage({
  searchParams,
}: BookmarksPageProps) {
  const { page: pageParam } = await searchParams;
  const parsedPage = Number(pageParam);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const result = await jobServerRequest.getBookmarkedJobs({ page, limit: 10 });

  return (
    <BookmarksContent
      initialJobs={result?.data ?? []}
      pagination={
        result?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }
      }
      embedded={true}
      basePath="/freelancer/bookmarks"
    />
  );
}
