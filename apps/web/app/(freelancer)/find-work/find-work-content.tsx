"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Clock, DollarSign } from "lucide-react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import type { ViewListJobResponseType } from "@shared/types";

type FindWorkContentProps = {
  initialJobs: ViewListJobResponseType["data"];
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  initialKeyword?: string;
  initialBudget?: string;
  initialTime?: string;
  initialSort?: string;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function FindWorkContent({
  initialJobs,
  initialPagination,
  initialKeyword = "",
  initialBudget = "all",
  initialTime = "all",
  initialSort = "newest",
}: FindWorkContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobs = initialJobs ?? [];
  const pagination = initialPagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  const formatPostedTime = (value: string | Date) => {
    const diffMs = Date.now() - new Date(value).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getBudgetText = (job: ViewListJobResponseType["data"][number]) => {
    if (job.budgetMin === null || job.budgetMax === null) {
      return "Negotiable";
    }

    return `$${job.budgetMin} - $${job.budgetMax}`;
  };

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [name, value] of Object.entries(updates)) {
      if (value === null || value === "all") {
        params.delete(name);
      } else {
        params.set(name, value);
      }
    }

    if (!("page" in updates)) {
      params.set("page", "1");
    }

    const query = params.toString();
    router.push(query ? `/find-work?${query}` : "/find-work");
  };

  const updateFilter = (name: "budget" | "time" | "sort", value: string) => {
    updateParams({ [name]: value });
  };

  const goToPage = (page: number) => {
    updateParams({ page: String(page) });
  };

  const resultsLabel = initialKeyword
    ? `Results for "${initialKeyword}"`
    : pagination.total > 0
      ? `${pagination.total} open project${pagination.total === 1 ? "" : "s"}`
      : "No open projects";

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="FREELANCER" />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-[#4fae2e]/25 dark:bg-[#12331f]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">Find Work</span>
            </nav>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Find Work
            </h1>
            <p className="mt-2 max-w-[42ch] text-base text-foreground/70 dark:text-foreground/75">
              Browse open projects and apply to work that fits your skills.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="grid w-full grid-cols-1 gap-3 sm:max-w-xl sm:grid-cols-2">
              <Select
                value={initialBudget}
                onValueChange={(value) => value && updateFilter("budget", value)}
              >
                <SelectTrigger className="h-11 w-full bg-background">
                  <SelectValue placeholder="Budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any budget</SelectItem>
                  <SelectItem value="under-500">Under $500</SelectItem>
                  <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                  <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
                  <SelectItem value="5000-plus">$5,000+</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={initialTime}
                onValueChange={(value) => value && updateFilter("time", value)}
              >
                <SelectTrigger className="h-11 w-full bg-background">
                  <SelectValue placeholder="Posted" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any time</SelectItem>
                  <SelectItem value="today">Posted today</SelectItem>
                  <SelectItem value="last-3-days">Last 3 days</SelectItem>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <p className="text-sm text-muted-foreground">{resultsLabel}</p>
              <Select
                value={initialSort}
                onValueChange={(value) => value && updateFilter("sort", value)}
              >
                <SelectTrigger className="h-11 w-44 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="title-asc">Title: A to Z</SelectItem>
                  <SelectItem value="title-desc">Title: Z to A</SelectItem>
                  <SelectItem value="budget-low">Budget: low to high</SelectItem>
                  <SelectItem value="budget-high">Budget: high to low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-2">
            {jobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                <p className="text-lg font-medium text-foreground">
                  No projects match these filters
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  Try a broader budget or time range, or clear your search from
                  the header.
                </p>
                <Button
                  variant="outline"
                  className="mt-6"
                  onClick={() => router.push("/find-work")}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {jobs.map((job) => {
                  const preview = job.description
                    ? stripHtml(job.description)
                    : "No description provided yet.";

                  return (
                    <li key={job.id}>
                      <Link
                        href={`/job/${job.slug}`}
                        className={`group block py-6 transition-colors hover:bg-[#eaf8df]/35 dark:hover:bg-[#12331f]/35 ${
                          job.featured
                            ? "border-l-2 border-l-[#4fae2e] pl-4 sm:pl-5"
                            : "pl-0 sm:pl-1"
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {job.featured ? (
                                <Badge className="bg-[#4fae2e] text-white hover:bg-[#4fae2e]">
                                  Featured
                                </Badge>
                              ) : null}
                              <h2 className="text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-[#4fae2e]">
                                {job.title}
                              </h2>
                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <DollarSign className="size-3.5 text-[#4fae2e]" />
                                {getBudgetText(job)}
                                <span className="text-foreground/40">·</span>
                                {job.budgetType}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="size-3.5 text-[#4fae2e]" />
                                {formatPostedTime(job.createdAt)}
                              </span>
                            </div>

                            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground line-clamp-2">
                              {preview}
                            </p>
                          </div>

                          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-[#4fae2e] transition-transform group-hover:translate-x-0.5">
                            View details
                            <ArrowRight className="size-4" />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {pagination.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-3 border-t border-border pt-8">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
