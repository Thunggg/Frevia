import { redirect } from "next/navigation";

export default async function SavedSearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/freelancer/saved-searches/${id}`);
}
