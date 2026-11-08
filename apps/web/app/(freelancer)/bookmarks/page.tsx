import { redirect } from "next/navigation";

type BookmarksPageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    order?: string;
  }>;
};

export default async function BookmarksPage({
  searchParams,
}: BookmarksPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  redirect(qs ? `/freelancer/bookmarks?${qs}` : "/freelancer/bookmarks");
}
