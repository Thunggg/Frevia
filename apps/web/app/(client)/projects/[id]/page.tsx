import { notFound } from "next/navigation";
import { getClientJobDetailServer } from "@/lib/get-job";
import { ProjectDetailContent } from "./project-detail-content";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getClientJobDetailServer(id);
  if (!job) notFound();
  return <ProjectDetailContent job={job} />;
}
