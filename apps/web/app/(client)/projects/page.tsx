import { getClientJobsServer } from "@/lib/get-job";
import { ProjectsContent } from "./projects-content";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const parsedPage = Number(pageParam);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const result = await getClientJobsServer({ page, limit: 10 });

  return (
    <ProjectsContent
      initialJobs={result?.data ?? []}
      pagination={result?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }}
    />
  );
}
