import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, SlidersHorizontal } from "@/components/icons";

import savedSearchServerRequest from "@/apiRequests/saved-search.server";
import {
  BUDGET_KEYS,
  SORT_KEYS,
  TIME_KEYS,
  translateFilterOption,
} from "@/lib/search-filter-labels";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import type { SavedSearchType } from "@shared/types";

export async function generateMetadata() {
  const t = await getTranslations("savedSearches");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

function toFindWorkHref(searchParams: SavedSearchType["searchParams"]) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `/freelancer/find-work?${query}` : "/freelancer/find-work";
}

export default async function FreelancerSavedSearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const savedSearchId = Number(id);
  if (!Number.isInteger(savedSearchId) || savedSearchId <= 0) notFound();

  const savedSearch =
    await savedSearchServerRequest.getSavedSearchDetail(savedSearchId);
  if (!savedSearch) notFound();

  const t = await getTranslations("savedSearches");
  const tFindWork = await getTranslations("findWork");

  const filterName = (name: string) => {
    if (name === "keyword") return t("filterSearch");
    if (name === "budget") return t("filterBudget");
    if (name === "time") return t("filterPosted");
    if (name === "sort") return t("filterSort");

    // Filter lạ (chưa có trong bảng dịch) vẫn hiển thị dạng đọc được.
    return name
      .replace(/([A-Z])/g, " $1")
      .replaceAll("-", " ")
      .replace(/^./, (value) => value.toUpperCase());
  };

  const filterValue = (name: string, value: unknown) => {
    if (typeof value === "string") {
      if (name === "budget")
        return translateFilterOption(tFindWork, BUDGET_KEYS, value);
      if (name === "time")
        return translateFilterOption(tFindWork, TIME_KEYS, value);
      if (name === "sort")
        return translateFilterOption(tFindWork, SORT_KEYS, value);
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    if (Array.isArray(value)) return value.map(String).join(", ");
    return JSON.stringify(value);
  };

  const filters = Object.entries(savedSearch.searchParams);

  return (
    <div className="flex flex-1 flex-col bg-background font-sans min-h-0">
      <main className="flex-1">
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
            <Button
              asChild
              variant="ghost"
              className="-ml-3 gap-2 text-foreground/70 hover:text-foreground"
            >
              <Link href="/freelancer/saved-searches">
                <ArrowLeft className="size-4" />
                {t("breadcrumb")}
              </Link>
            </Button>
            <div className="mt-4 flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#4fae2e] text-white">
                <SlidersHorizontal className="size-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-[#3f9225]">
                  {t("detailBadge")}
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {savedSearch.name}
                </h1>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-semibold text-foreground">
              {t("filtersTitle")}
            </h2>
            {filters.length ? (
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                {filters.map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-muted/60 px-4 py-3">
                    <dt className="text-xs font-medium text-muted-foreground">
                      {filterName(key)}
                    </dt>
                    <dd className="mt-1 break-words text-sm font-medium text-foreground">
                      {filterValue(key, value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="mt-5 rounded-lg bg-muted/60 px-4 py-5 text-sm text-muted-foreground">
                {t("allProjectsDefault")}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Badge variant="secondary" className="w-fit font-normal">
                {t("detailIdBadge", { id: savedSearch.id })}
              </Badge>
              <Button
                asChild
                className="bg-[#4fae2e] text-white hover:bg-[#459928]"
              >
                <Link href={toFindWorkHref(savedSearch.searchParams)}>
                  <Search className="mr-2 size-4" />
                  {t("viewMatchingJobs")}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
