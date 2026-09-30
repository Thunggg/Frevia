import { getClientJobsServer } from "@/lib/get-job";
import { ProjectsContent } from "./projects-content";

export default async function ProjectsPage() {
  const result = await getClientJobsServer({ page: 1, limit: 20 });
  return <ProjectsContent initialJobs={result?.data ?? []} />;
}
