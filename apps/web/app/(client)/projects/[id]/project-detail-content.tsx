import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  DollarSign,
  Tag,
} from "lucide-react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import type { ViewJobDetailResType } from "@shared/types";

function formatBudget(job: Pick<ViewJobDetailResType, "budgetMin" | "budgetMax">) {
  if (job.budgetMin === null || job.budgetMax === null) {
    return "Negotiable";
  }
  return `$${job.budgetMin} - $${job.budgetMax}`;
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
      <p className="mt-4 max-w-prose text-[15px] leading-8 text-muted-foreground">
        No description provided yet.
      </p>
    );
  }

  if (looksLikeHtml(description)) {
    return (
      <div
        className="job-description mt-4 max-w-prose text-[15px] leading-8 text-muted-foreground [&_a]:text-[#4fae2e] [&_a]:underline-offset-2 hover:[&_a]:underline [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    );
  }

  return (
    <p className="mt-4 max-w-prose whitespace-pre-wrap text-[15px] leading-8 text-muted-foreground">
      {description}
    </p>
  );
}

function statusBadgeClass(status: string) {
  if (status === "OPEN") {
    return "border-transparent bg-[#eaf8df] text-[#4fae2e] dark:bg-[#12331f]";
  }
  return "";
}

export function ProjectDetailContent({ job }: { job: ViewJobDetailResType }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="CLIENT" />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-[#4fae2e]/25 dark:bg-[#12331f]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <Link
                href="/projects"
                className="transition-colors hover:text-[#4fae2e]"
              >
                My Jobs
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="max-w-[220px] truncate font-medium text-foreground">
                {job.title}
              </span>
            </nav>

            <Link
              href="/projects"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
            >
              <ArrowLeft className="size-3.5" />
              Back to My Jobs
            </Link>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <Badge
                  variant="outline"
                  className={statusBadgeClass(job.status)}
                >
                  {job.status}
                </Badge>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  {job.title}
                </h1>
                <p className="mt-3 text-2xl font-semibold text-[#4fae2e]">
                  {formatBudget(job)}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-4 text-[#4fae2e]" />
                    {job.budgetType.replaceAll("_", " ")}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4 text-[#4fae2e]" />
                    Deadline: {formatDate(job.deadline)}
                  </span>
                </div>
              </div>

              <Button
                asChild
                className="bg-[#4fae2e] text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
              >
                <Link href="/projects">Manage from My Jobs</Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-10">
          <article className="lg:col-span-8">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Job description
            </h2>
            <JobDescription description={job.description} />
          </article>

          <aside className="lg:col-span-4">
            <div className="rounded-xl border border-border p-5 sm:p-6">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Required skills
              </h2>
              {job.skills.length ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <li key={skill.skillId}>
                      <Badge
                        variant="secondary"
                        className="border border-[#4fae2e]/20 bg-[#eaf8df] text-foreground dark:border-[#4fae2e]/30 dark:bg-[#12331f]"
                      >
                        <Tag className="mr-1 size-3 text-[#4fae2e]" />
                        {skill.skill.name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  No skills listed.
                </p>
              )}

              <div className="mt-6 space-y-3 border-t border-border pt-5 text-sm text-muted-foreground">
                <p className="inline-flex items-center gap-2">
                  <DollarSign className="size-4 text-[#4fae2e]" />
                  Budget:{" "}
                  <span className="font-medium text-foreground">
                    {formatBudget(job)}
                  </span>
                </p>
                <p className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4 text-[#4fae2e]" />
                  Deadline:{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(job.deadline)}
                  </span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
