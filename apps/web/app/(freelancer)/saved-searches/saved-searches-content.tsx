"use client";

import Link from "next/link";
import { BookmarkCheck, Search, SlidersHorizontal } from "lucide-react";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import type { SavedSearchType } from "@shared/types";

type SavedSearchesContentProps = {
  savedSearches: SavedSearchType[];
};

function toFindWorkHref(searchParams: SavedSearchType["searchParams"]) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? `/find-work?${query}` : "/find-work";
}

function filterSummary(searchParams: SavedSearchType["searchParams"]) {
  const labels: string[] = [];
  const keyword = searchParams.keyword;
  const budget = searchParams.budget;
  const time = searchParams.time;

  if (typeof keyword === "string" && keyword) labels.push(keyword);
  if (typeof budget === "string" && budget !== "all") labels.push(budget.replaceAll("-", " "));
  if (typeof time === "string" && time !== "all") labels.push(time.replaceAll("-", " "));

  return labels.length ? labels : ["All open projects"];
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function SavedSearchesContent({ savedSearches }: SavedSearchesContentProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="FREELANCER" />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">Home</Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">Saved searches</span>
            </nav>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  <BookmarkCheck className="size-7 text-[#4fae2e]" />
                  Saved searches
                </h1>
                <p className="mt-2 max-w-[46ch] text-base text-foreground/70 dark:text-foreground/75">
                  Return to your preferred job filters in one click.
                </p>
              </div>
              <p className="text-sm text-foreground/65">
                <span className="font-semibold text-foreground">{savedSearches.length}</span>{" "}
                {savedSearches.length === 1 ? "saved search" : "saved searches"}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          {savedSearches.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {savedSearches.map((savedSearch) => {
                const filters = filterSummary(savedSearch.searchParams);
                return (
                  <article
                    key={savedSearch.id}
                    className="flex min-h-52 flex-col rounded-xl border border-border bg-card p-5 shadow-sm shadow-[#24412c]/5 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#4fae2e]/40 hover:shadow-md hover:shadow-[#24412c]/10"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                        <SlidersHorizontal className="size-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">Saved {formatDate(savedSearch.createdAt)}</span>
                    </div>
                    <h2 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{savedSearch.name}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {filters.map((filter) => (
                        <Badge key={filter} variant="secondary" className="max-w-full truncate font-normal capitalize">
                          {filter}
                        </Badge>
                      ))}
                    </div>
                    <Button asChild className="mt-auto w-full bg-[#4fae2e] text-white hover:bg-[#459928]">
                      <Link href={toFindWorkHref(savedSearch.searchParams)}>
                        <Search className="mr-2 size-4" />
                        View matching jobs
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="mt-2 w-full text-foreground/70 hover:text-foreground">
                      <Link href={`/saved-searches/${savedSearch.id}`}>View details</Link>
                    </Button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                <BookmarkCheck className="size-7" />
              </div>
              <h2 className="text-lg font-medium text-foreground">No saved searches yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Set up filters in Find Work, then save the search for later.
              </p>
              <Button asChild className="mt-6 bg-[#4fae2e] text-white hover:bg-[#459928]">
                <Link href="/find-work">Find work</Link>
              </Button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
