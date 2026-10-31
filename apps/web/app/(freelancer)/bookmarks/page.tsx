import { redirect } from "next/navigation";

type BookmarksPageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function BookmarksPage({
  searchParams,
}: BookmarksPageProps) {
  const { page } = await searchParams;
  const query = page ? `?page=${page}` : "";
  redirect(`/freelancer/bookmarks${query}`);
}
