"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { Search, SlidersHorizontal } from "@/components/icons";

import {
  BUDGET_KEYS,
  SORT_KEYS,
  TIME_KEYS,
  translateFilterOption,
} from "@/lib/search-filter-labels";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import type { JobCategoryBrowseItemType, SavedSearchType } from "@shared/types";

type SavedSearchDetailDialogProps = {
  savedSearch: SavedSearchType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: JobCategoryBrowseItemType[];
  onApply?: (savedSearch: SavedSearchType) => void;
};

function toFindWorkHref(searchParams: SavedSearchType["searchParams"]) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query
    ? `/freelancer/search/jobs?${query}`
    : "/freelancer/search/jobs";
}

export function SavedSearchDetailDialog({
  savedSearch,
  open,
  onOpenChange,
  categories = [],
  onApply,
}: SavedSearchDetailDialogProps) {
  const t = useTranslations("savedSearches");
  const tFindWork = useTranslations("findWork");
  const format = useFormatter();

  if (!savedSearch) return null;

  const filterName = (name: string) => {
    if (name === "keyword" || name === "q") return t("filterSearch");
    if (name === "category") return t("filterCategory");
    if (name === "skill") return t("filterSkill");
    if (name === "hiringType") return t("filterHiringType");
    if (name === "budget" || name === "budgetMin" || name === "budgetMax")
      return t("filterBudget");
    if (name === "time") return t("filterPosted");
    if (name === "sort") return t("filterSort");

    return name
      .replace(/([A-Z])/g, " $1")
      .replaceAll("-", " ")
      .replace(/^./, (value) => value.toUpperCase());
  };

  const filterValue = (name: string, value: unknown) => {
    if (typeof value === "string") {
      if (name === "category") {
        const names = value
          .split(",")
          .map((slug) => slug.trim())
          .filter(Boolean)
          .map(
            (slug) => categories.find((c) => c.slug === slug)?.name || slug,
          );
        return names.length ? names.join(", ") : value;
      }
      if (name === "budget")
        return translateFilterOption(tFindWork, BUDGET_KEYS, value);
      if (name === "time")
        return translateFilterOption(tFindWork, TIME_KEYS, value);
      if (name === "sort")
        return translateFilterOption(tFindWork, SORT_KEYS, value);
      if (name === "hiringType")
        return value === "SINGLE"
          ? tFindWork("modal.hiringTypeSingle")
          : tFindWork("modal.hiringTypeMultiple");
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    if (Array.isArray(value)) return value.map(String).join(", ");
    return JSON.stringify(value);
  };

  const filters = Object.entries(savedSearch.searchParams ?? {});
  const savedAtLabel = format.dateTime(new Date(savedSearch.createdAt), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl font-sans">
        <DialogHeader>
          <div className="flex items-start gap-3.5 pr-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#D0E1F8] text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-300">
              <SlidersHorizontal className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#0069D3]">
                {t("detailBadge")}
              </p>
              <DialogTitle className="mt-0.5 text-lg font-bold tracking-tight text-foreground break-words">
                {savedSearch.name}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                {t("savedAt", { date: savedAtLabel })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="my-2 space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground">
            {t("filtersTitle")}
          </h3>
          {filters.length > 0 ? (
            <dl className="grid gap-2.5 sm:grid-cols-2 max-h-64 overflow-y-auto pr-1">
              {filters.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-border/60 bg-muted/40 px-3.5 py-2.5"
                >
                  <dt className="text-[11px] font-medium text-muted-foreground">
                    {filterName(key)}
                  </dt>
                  <dd className="mt-0.5 break-words text-xs font-semibold text-foreground">
                    {filterValue(key, value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-4 text-xs text-muted-foreground">
              {t("allProjectsDefault")}
            </div>
          )}
        </div>

        <DialogFooter className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border/60 pt-4">
          <Badge variant="secondary" className="w-fit font-normal text-[11px]">
            {t("detailIdBadge", { id: savedSearch.id })}
          </Badge>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full text-xs h-9 px-4"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>

            {onApply ? (
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-[#0069D3] text-white hover:bg-[#005bb8] text-xs font-semibold h-9 px-4"
                onClick={() => {
                  onApply(savedSearch);
                  onOpenChange(false);
                }}
              >
                <Search className="mr-1.5 size-3.5" />
                {t("viewMatchingJobs")}
              </Button>
            ) : (
              <Button
                asChild
                size="sm"
                className="rounded-full bg-[#0069D3] text-white hover:bg-[#005bb8] text-xs font-semibold h-9 px-4"
              >
                <Link href={toFindWorkHref(savedSearch.searchParams)}>
                  <Search className="mr-1.5 size-3.5" />
                  {t("viewMatchingJobs")}
                </Link>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
