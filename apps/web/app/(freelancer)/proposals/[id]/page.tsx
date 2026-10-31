import { redirect } from "next/navigation";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/freelancer/proposals/${id}`);
}
