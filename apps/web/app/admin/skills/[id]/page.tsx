import Link from "next/link";
import { ArrowLeft, Briefcase, Tags, TagX } from "lucide-react";
import adminServerRequest from "@/apiRequests/admin.server";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { UpdateSkillDialog } from "../components/update-skill-dialog";

export const dynamic = "force-dynamic";

interface SkillDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSkillDetailPage({
  params,
}: SkillDetailPageProps) {
  const { id } = await params;
  const skillId = Number(id);

  if (isNaN(skillId)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <TagX className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground">Invalid Skill ID</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          The requested skill ID &quot;{id}&quot; is not valid.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/admin/skills">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Skill Management
          </Link>
        </Button>
      </div>
    );
  }

  const skill = await adminServerRequest.getSkillById(skillId);

  if (!skill) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <TagX className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground">Skill Not Found</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          No skill exists with ID #{skillId}.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/admin/skills">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Skill Management
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <Button asChild variant="outline" size="sm">
        <Link href="/admin/skills">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Skill Management
        </Link>
      </Button>

      {/* Header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
              <Tags className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {skill.name}
              </h1>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                slug: {skill.slug} · ID #{skill.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {skill.deletedAt === null ? (
              <Badge className="border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                Active
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Deleted
              </Badge>
            )}
            <UpdateSkillDialog skill={skill} triggerClassName="h-9 w-9 text-[#4fae2e] hover:bg-[#4fae2e]/10 hover:text-[#4fae2e]" />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Description
        </h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {skill.description || "No description provided for this skill."}
        </p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Briefcase className="size-3.5" />
            Jobs using this skill
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {skill.jobCount}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Created</p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {new Date(skill.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Last updated
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {new Date(skill.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
