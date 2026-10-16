import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
} from "@/components/icons";
import type { ViewJobDetailResType } from "@shared/types";

function formatBudget(
  job: Pick<ViewJobDetailResType, "budgetMin" | "budgetMax">,
) {
  if (job.budgetMin === null || job.budgetMax === null) {
    return "Negotiable";
  }
  return `$${job.budgetMin.toLocaleString()} - $${job.budgetMax.toLocaleString()}`;
}

function formatDate(value: string | Date | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function JobDescription({ description }: { description: string | null }) {
  if (!description) {
    return (
      <p className="text-sm italic text-muted-foreground">
        No description provided yet.
      </p>
    );
  }

  if (looksLikeHtml(description)) {
    return (
      <div
        className="job-description max-w-none text-sm sm:text-base leading-relaxed text-foreground/85 [&_a]:text-[#0069D3] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#005bb8] [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1.5 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    );
  }

  return (
    <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-foreground/85">
      {description}
    </p>
  );
}

function JobStatusBadge({ status }: { status: string }) {
  const label = status[0] + status.slice(1).toLowerCase().replace("_", " ");

  const statusStyles: Record<string, string> = {
    OPEN: "text-emerald-600 dark:text-emerald-400",
    IN_PROGRESS: "text-[#0069D3] dark:text-blue-300",
    COMPLETED: "text-purple-600 dark:text-purple-400",
    CLOSED: "text-zinc-600 dark:text-zinc-400",
    CANCELLED: "text-rose-600 dark:text-rose-400",
  };

  const style = statusStyles[status] || "bg-zinc-500/10 text-zinc-600";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
}

export function JobDetail({ job }: { job: ViewJobDetailResType }) {
  return (
    <div className="min-h-full bg-background font-sans">
      <div className="px-6 py-8 sm:py-12 lg:px-8">
        {/* Navigation / Back link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/client/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-[#0069D3]"
          >
            <ArrowLeft className="size-3.5" />
            <span>My Jobs</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground">Job #{job.id}</span>
          </Link>
        </div>

        {/* Title Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans">
              {job.title}
            </h1>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 text-muted-foreground/70" />
            <span>Posted on {formatDate(job.createdAt)}</span>
          </p>
        </div>

        {/* Job Description (Open, spacious, no cards/boxes) */}
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Description
          </h2>
          <JobDescription description={job.description} />
        </section>

        {/* Minimal Meta Row (No cards, just clean columns with divider) */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-y border-border py-4 sm:grid-cols-4 sm:gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Budget
            </p>
            <p className="mt-1 text-sm sm:text-base font-bold text-foreground">
              {formatBudget(job)}
            </p>
            {job.budgetType ? (
              <span className="text-[11px] text-muted-foreground capitalize">
                {job.budgetType.toLowerCase()}
              </span>
            ) : null}
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Deadline
            </p>
            <p className="mt-1 text-sm sm:text-base font-semibold text-foreground">
              {formatDate(job.deadline)}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </p>
            <div className="mt-1">
              <JobStatusBadge status={job.status} />
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Proposals
            </p>
            <div className="mt-1">
              <Link
                href={`/client/jobs/${job.id}/proposals`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0069D3] hover:underline"
              >
                <span>Check proposals</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
        {/* Required Skills (Simple badges, no bulky card) */}
        {job.skills && job.skills.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Required Skills
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill) => (
                <span
                  key={skill.skillId}
                  className="rounded-full bg-[#EBF3FE] dark:bg-[#0069D3]/15 text-[#0069D3] dark:text-blue-200 border border-[#D0E1F8] dark:border-[#0069D3]/30 px-3 py-1 text-xs font-medium"
                >
                  {skill.skill.name}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
