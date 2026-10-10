import { notFound } from "next/navigation";
import jobServerRequest from "@/apiRequests/job.server";
import { ProjectDetailContent } from "./project-detail-content";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await jobServerRequest.getClientJobDetail(id);
  if (!job) notFound();
  return <ProjectDetailContent job={job} />;
}
