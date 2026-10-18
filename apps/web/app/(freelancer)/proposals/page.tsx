import { redirect } from "next/navigation";

type ProposalsPageProps = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export default async function ProposalsPage({
  searchParams,
}: ProposalsPageProps) {
  const params = await searchParams;
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", params.page);
  if (params.status) queryParams.set("status", params.status);
  const qs = queryParams.toString();
  redirect(qs ? `/freelancer/proposals?${qs}` : "/freelancer/proposals");
}
