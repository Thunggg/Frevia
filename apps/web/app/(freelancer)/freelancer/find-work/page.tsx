import { redirect } from "next/navigation";

export default async function FreelancerFindWorkRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams(params).toString();
  redirect(
    qs
      ? `/freelancer/find-work/best-matches?${qs}`
      : "/freelancer/find-work/best-matches",
  );
}
