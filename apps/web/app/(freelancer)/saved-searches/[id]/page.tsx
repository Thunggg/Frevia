import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";

import savedSearchServerRequest from "@/apiRequests/saved-search.server";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import type { SavedSearchType } from "@shared/types";

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

function formatFilterValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).replaceAll("-", " ");
  }
  if (Array.isArray(value)) return value.map(String).join(", ");
  return JSON.stringify(value);
}

function formatFilterName(name: string) {
  return name.replace(/([A-Z])/g, " $1").replaceAll("-", " ").replace(/^./, (value) => value.toUpperCase());
}

export default async function SavedSearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const savedSearchId = Number(id);
  if (!Number.isInteger(savedSearchId) || savedSearchId <= 0) notFound();

  const savedSearch = await savedSearchServerRequest.getSavedSearchDetail(savedSearchId);
  if (!savedSearch) notFound();

  const filters = Object.entries(savedSearch.searchParams);

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="FREELANCER" />
      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <Button asChild variant="ghost" className="-ml-3 gap-2 text-foreground/70 hover:text-foreground">
              <Link href="/saved-searches"><ArrowLeft className="size-4" />Saved searches</Link>
            </Button>
            <div className="mt-5 flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#4fae2e] text-white">
                <SlidersHorizontal className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#3f9225]">Saved search</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{savedSearch.name}</h1>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-foreground">Search filters</h2>
            {filters.length ? (
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {filters.map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-muted/60 px-4 py-3">
                    <dt className="text-xs font-medium text-muted-foreground">{formatFilterName(key)}</dt>
                    <dd className="mt-1 break-words text-sm font-medium text-foreground">{formatFilterValue(value)}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-5 rounded-lg bg-muted/60 px-4 py-5 text-sm text-muted-foreground">
                This search shows all open projects with the default sort order.
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Badge variant="secondary" className="w-fit font-normal">Saved search #{savedSearch.id}</Badge>
              <Button asChild className="bg-[#4fae2e] text-white hover:bg-[#459928]">
                <Link href={toFindWorkHref(savedSearch.searchParams)}><Search className="mr-2 size-4" />View matching jobs</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
