import Link from "next/link";
import { Button } from "@repo/ui/components/shadcn/button";

export function ProjectDetail({ projectId }: { projectId: string }) {
  return <div><h1 className="text-2xl font-bold">Job #{projectId}</h1><p className="mt-2 text-muted-foreground">Manage this job from the My Jobs page.</p><Button className="mt-4" asChild><Link href="/projects">Back to My Jobs</Link></Button></div>;
}
