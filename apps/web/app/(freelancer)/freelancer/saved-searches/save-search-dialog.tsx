"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookmarkPlus,
  Check,
  Loader2,
  Trash2,
} from "@/components/icons";

import savedSearchApiRequest from "@/apiRequests/saved-search";
import { useActionPermission } from "@/hooks/use-action-permission";
import {
  BUDGET_KEYS,
  SORT_KEYS,
  TIME_KEYS,
  translateFilterOption,
} from "@/lib/search-filter-labels";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { JobCategoryBrowseItemType, SavedSearchType } from "@shared/types";

// ==========================================
// Helper functions for parameter normalization & matching
// ==========================================

export function getSavedSearchErrorMessage(
  error: unknown,
  fallbackMessage: string,
  limitReachedMessage?: string,
): string {
  if (error && typeof error === "object") {
    const apiError = (
      error as {
        response?: {
          error?: {
            message?: string;
            details?: Array<{ message?: string }>;
          };
        };
      }
    ).response?.error;

    const details = apiError?.details;
    if (Array.isArray(details)) {
      for (const issue of details) {
        if (
          issue.message === "Error.SavedSearchLimitExceeded" ||
          issue.message?.includes("LimitExceeded")
        ) {
          return limitReachedMessage || fallbackMessage;
        }
      }
    }
    if (
      apiError?.message === "Error.SavedSearchLimitExceeded" ||
      apiError?.message?.includes("LimitExceeded")
    ) {
      return limitReachedMessage || fallbackMessage;
    }
    if (typeof (error as { message?: unknown }).message === "string") {
      const msg = (error as { message: string }).message;
      if (msg.includes("LimitExceeded") || msg.includes("limit")) {
        return limitReachedMessage || fallbackMessage;
      }
      if (
        msg &&
        msg !== "Request failed" &&
        msg !== "Bad Request" &&
        msg !== "Validation failed"
      ) {
        return msg;
      }
    }
  }
  return fallbackMessage;
}

export function cleanSearchParams(
  rawParams: Record<string, unknown>,
): Record<string, string> {
  const result: Record<string, string> = {};

  const query = rawParams.q ?? rawParams.keyword;
  if (query !== undefined && query !== null && String(query).trim()) {
    result.q = String(query).trim();
  }

  for (const [key, value] of Object.entries(rawParams || {})) {
    if (
      key === "page" ||
      key === "limit" ||
      key === "q" ||
      key === "keyword" ||
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all"
    ) {
      continue;
    }
    if (key === "sort" && String(value).trim().toLowerCase() === "newest") {
      continue;
    }
    result[key] = String(value).trim();
  }
  return result;
}

export function normalizeCanonicalParams(
  rawParams: Record<string, unknown>,
): Record<string, string> {
  const normalized: Record<string, string> = {};

  // Chuẩn hóa q / keyword thành canonical 'q'
  const query = rawParams.q ?? rawParams.keyword;
  if (query !== undefined && query !== null) {
    const trimmedQ = String(query).trim().toLowerCase();
    if (trimmedQ) {
      normalized.q = trimmedQ;
    }
  }

  for (const [key, value] of Object.entries(rawParams || {})) {
    if (
      key === "page" ||
      key === "limit" ||
      key === "q" ||
      key === "keyword" ||
      value === undefined ||
      value === null
    ) {
      continue;
    }

    const strValue = String(value).trim();
    if (!strValue || strValue === "all") continue;

    // Bỏ qua giá trị mặc định của sort là "newest"
    if (key === "sort" && strValue.toLowerCase() === "newest") continue;

    // Với các trường đa giá trị dạng chuỗi phân cách dấu phẩy (category, skill):
    // Tách mảng, loại bỏ phần tử rỗng, chuyển chữ thường và sắp xếp theo bảng chữ cái
    if (key === "category" || key === "skill") {
      const sortedTokens = strValue
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .sort()
        .join(",");
      if (sortedTokens) {
        normalized[key] = sortedTokens;
      }
      continue;
    }

    normalized[key] = strValue.toLowerCase();
  }

  return normalized;
}

export function normalizedSearchEntries(
  params: Record<string, unknown>,
): [string, string][] {
  const normalized = normalizeCanonicalParams(params);
  return Object.entries(normalized).sort(([a], [b]) => a.localeCompare(b));
}

export function matchesSearch(
  current: Record<string, unknown>,
  saved: SavedSearchType,
): boolean {
  const currentEntries = normalizedSearchEntries(current);
  const savedEntries = normalizedSearchEntries(
    (saved.searchParams ?? {}) as Record<string, unknown>,
  );
  if (currentEntries.length !== savedEntries.length) return false;
  return JSON.stringify(currentEntries) === JSON.stringify(savedEntries);
}

export function buildFilterBreakdown(
  params: Record<string, unknown>,
  categories: JobCategoryBrowseItemType[] = [],
  tFindWork: (key: string) => string,
  tSaved: (key: string) => string,
) {
  const list: { label: string; value: string }[] = [];
  const query = (params.q || params.keyword) as string | undefined;
  if (query && String(query).trim()) {
    list.push({ label: tSaved("filterSearch"), value: String(query).trim() });
  }

  const categorySlug = params.category as string | undefined;
  if (categorySlug && categorySlug !== "all") {
    const slugs = String(categorySlug)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const names = slugs
      .map((slug) => categories.find((c) => c.slug === slug)?.name || slug)
      .join(", ");
    if (names) {
      list.push({
        label: tSaved("filterCategory") || "Category",
        value: names,
      });
    }
  }

  if (params.budget && params.budget !== "all") {
    list.push({
      label: tSaved("filterBudget"),
      value: translateFilterOption(
        tFindWork,
        BUDGET_KEYS,
        String(params.budget),
      ),
    });
  } else if (params.budgetMin || params.budgetMax) {
    const min = params.budgetMin ? `$${params.budgetMin}` : "$0";
    const max = params.budgetMax ? `$${params.budgetMax}` : "∞";
    list.push({
      label: tSaved("filterBudget"),
      value: `${min} – ${max}`,
    });
  }

  if (params.skill && String(params.skill).trim()) {
    list.push({
      label: tSaved("filterSkill") || "Skill",
      value: String(params.skill),
    });
  }

  if (params.hiringType && params.hiringType !== "all") {
    list.push({
      label: tSaved("filterHiringType") || "Hiring type",
      value:
        params.hiringType === "SINGLE"
          ? tFindWork("modal.hiringTypeSingle")
          : tFindWork("modal.hiringTypeMultiple"),
    });
  }

  if (params.time && params.time !== "all") {
    list.push({
      label: tSaved("filterPosted"),
      value: translateFilterOption(tFindWork, TIME_KEYS, String(params.time)),
    });
  }

  if (params.sort && params.sort !== "newest") {
    list.push({
      label: tSaved("filterSort"),
      value: translateFilterOption(tFindWork, SORT_KEYS, String(params.sort)),
    });
  }

  return list;
}

function getDefaultSearchName(
  params: Record<string, unknown>,
  categories: JobCategoryBrowseItemType[] = [],
  tSaved: (key: string) => string,
): string {
  const query = (params.q || params.keyword) as string | undefined;
  if (query && String(query).trim()) {
    return String(query).trim();
  }
  const categorySlug = params.category as string | undefined;
  if (categorySlug && categorySlug !== "all") {
    const firstSlug = String(categorySlug).split(",")[0]?.trim();
    const cat = categories.find((c) => c.slug === firstSlug);
    if (cat?.name) return cat.name;
  }
  if (params.skill && String(params.skill).trim()) {
    return (
      String(params.skill).split(",")[0]?.trim() || tSaved("allOpenProjects")
    );
  }
  return tSaved("allOpenProjects");
}

function formatDate(isoOrDate: string | Date | undefined): string {
  if (!isoOrDate) return "";
  try {
    const d = new Date(isoOrDate);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

// ==========================================
// 1. SaveSearchModal (Button 1: Save current search)
// ==========================================

export type SaveSearchModalProps = {
  searchParams: Record<string, string>;
  savedSearches: SavedSearchType[];
  categories?: JobCategoryBrowseItemType[];
  onSaved?: (savedItem?: SavedSearchType) => void;
  onOpenSavedSearches?: () => void;
};

export function SaveSearchModal({
  searchParams,
  savedSearches = [],
  categories = [],
  onSaved,
}: SaveSearchModalProps) {
  const t = useTranslations("savedSearches");
  const tFindWork = useTranslations("findWork");
  const { can } = useActionPermission();
  const canCreateSavedSearch = can("POST", "/api/saved-searches");
  const canUpdateSavedSearch = can("PATCH", "/api/saved-searches/:id");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLimitReached = savedSearches.length >= 30;
  const matchingSavedSearch = savedSearches.find((s) =>
    matchesSearch(searchParams, s),
  );
  const isCurrentSearchSaved = Boolean(matchingSavedSearch);

  const defaultName = getDefaultSearchName(searchParams, categories, t);
  const filterList = buildFilterBreakdown(
    searchParams,
    categories,
    tFindWork,
    t,
  );

  const trimmedName = name.trim().toLowerCase();
  const isNameChanged = matchingSavedSearch
    ? name.trim() !== matchingSavedSearch.name.trim()
    : true;

  const isNameDuplicate =
    trimmedName.length > 0 &&
    savedSearches.some(
      (s) =>
        (matchingSavedSearch ? s.id !== matchingSavedSearch.id : true) &&
        s.name.trim().toLowerCase() === trimmedName,
    );

  const isSaveDisabled =
    isSubmitting ||
    !name.trim() ||
    (isCurrentSearchSaved ? !isNameChanged : isLimitReached);

  const handleOpen = () => {
    setName(matchingSavedSearch?.name || defaultName);
    setOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isCurrentSearchSaved && !isNameChanged) return;

    setIsSubmitting(true);
    try {
      if (matchingSavedSearch && canUpdateSavedSearch) {
        const res = await savedSearchApiRequest.update(matchingSavedSearch.id, {
          name: name.trim(),
        });
        toastSuccess({ message: t("saved") });
        setOpen(false);
        onSaved?.(res.data);
      } else if (canCreateSavedSearch) {
        if (isLimitReached) {
          toastError({ message: t("limitReached") });
          return;
        }
        const cleanParams = cleanSearchParams(searchParams);
        const res = await savedSearchApiRequest.create({
          name: name.trim(),
          searchParams: cleanParams,
        });
        toastSuccess({ message: t("saved") });
        setOpen(false);
        onSaved?.(res.data);
      }
    } catch (error) {
      toastError({
        message: getSavedSearchErrorMessage(
          error,
          t("saveFailed"),
          t("limitReached"),
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreateSavedSearch) return null;

  return (
    <>
      {isCurrentSearchSaved ? (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/60 px-4 py-1.5 text-xs font-semibold text-[#0069D3] dark:text-blue-400 hover:bg-blue-100/70 dark:hover:bg-blue-900/60 transition-colors shadow-2xs cursor-pointer shrink-0 whitespace-nowrap min-w-fit"
          title={t("currentSaved")}
        >
          <BookmarkCheck className="size-3.5 text-[#0069D3] dark:text-blue-400 shrink-0" />
          <span className="whitespace-nowrap">{t("currentSaved")}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          disabled={isLimitReached}
          className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground hover:border-[#0069D3]/40 hover:text-[#0069D3] dark:hover:text-blue-400 hover:bg-muted/70 transition-colors shadow-2xs cursor-pointer shrink-0 whitespace-nowrap min-w-fit disabled:opacity-50 disabled:cursor-not-allowed"
          title={isLimitReached ? t("limitReached") : t("saveSearch")}
        >
          <BookmarkPlus className="size-3.5 text-[#0069D3] dark:text-blue-400 shrink-0" />
          <span className="whitespace-nowrap">{tFindWork("searchPage.saveSearch")}</span>
        </button>
      )}

      {/* Dialog for Save Search */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl font-sans overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              {t("saveSearch")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isCurrentSearchSaved
                ? t("alreadySavedHint", {
                    name: matchingSavedSearch?.name ?? "",
                  })
                : t("confirmHint", { name: defaultName })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="saved-search-name-input"
                className="text-xs font-semibold text-foreground"
              >
                {t("nameLabel")}
              </Label>
              <Input
                id="saved-search-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                maxLength={100}
                className="h-10 rounded-xl bg-background text-xs px-3.5 w-full"
                autoFocus
                required
              />
              {isNameDuplicate && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-0.5">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>{t("duplicateNameWarning")}</span>
                </div>
              )}
            </div>

            {/* Active Criteria breakdown */}
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2 text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                {t("filtersTitle")}
              </span>
              {filterList.length > 0 ? (
                <div className="space-y-1.5">
                  {filterList.map((f) => (
                    <div
                      key={f.label}
                      className="flex items-start justify-between gap-3 text-xs"
                    >
                      <span className="text-muted-foreground shrink-0 font-medium">
                        {f.label}:
                      </span>
                      <span className="font-semibold text-foreground text-right break-words max-w-[70%]">
                        {f.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground italic">
                  {t("allOpenProjects")}
                </span>
              )}
            </div>

            <DialogFooter className="flex items-center justify-end gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full text-xs px-4 h-9"
                disabled={isSubmitting}
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold px-5 h-9 whitespace-nowrap min-w-[120px]"
                disabled={isSaveDisabled}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    <span>{t("saving")}</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="size-3.5 mr-1.5 shrink-0" />
                    <span className="whitespace-nowrap">{t("saveSearch")}</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==========================================
// 2. SavedSearchesDialog (Button 2: View and manage saved searches)
// ==========================================

export type SavedSearchesDialogProps = {
  savedSearches: SavedSearchType[];
  currentSearchParams?: Record<string, string>;
  categories?: JobCategoryBrowseItemType[];
  onApply: (savedSearch: SavedSearchType) => void;
  onChanged?: (updatedItem?: SavedSearchType) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SavedSearchesDialog({
  savedSearches = [],
  currentSearchParams = {},
  categories = [],
  onApply,
  onChanged,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: SavedSearchesDialogProps) {
  const t = useTranslations("savedSearches");
  const tFindWork = useTranslations("findWork");
  const { can } = useActionPermission();
  const canViewSavedSearches = can("GET", "/api/saved-searches");
  const canDeleteSavedSearch = can("DELETE", "/api/saved-searches/:id");

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = setControlledOpen || setUncontrolledOpen;

  const [deletingItem, setDeletingItem] = useState<SavedSearchType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchSummary = (params: SavedSearchType["searchParams"]) => {
    const list = buildFilterBreakdown(
      (params ?? {}) as Record<string, unknown>,
      categories,
      tFindWork,
      t,
    );
    return list.length > 0
      ? list.map((item) => `${item.label}: ${item.value}`).join(" • ")
      : t("allOpenProjects");
  };

  const handleDelete = async () => {
    if (!deletingItem || !canDeleteSavedSearch) return;
    setIsSubmitting(true);
    try {
      await savedSearchApiRequest.delete(deletingItem.id);
      toastSuccess({ message: t("deleted") });
      setDeletingItem(null);
      onChanged?.();
    } catch (error) {
      toastError({
        message: getSavedSearchErrorMessage(error, t("deleteFailed")),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canViewSavedSearches) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-[#0069D3]/40 hover:bg-muted/70 transition-colors shadow-2xs cursor-pointer shrink-0 whitespace-nowrap min-w-fit"
      >
        <Bookmark className="size-3.5 text-[#0069D3] dark:text-blue-400 shrink-0" />
        <span className="whitespace-nowrap">
          {tFindWork("searchPage.savedSearches", {
            count: savedSearches.length,
          })}
        </span>
      </button>

      {/* Main Saved Searches Dialog */}
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(40rem,calc(100dvh-2rem))] overflow-y-auto sm:max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl font-sans">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base font-bold text-foreground">
                {t("dialogTitle")}
              </DialogTitle>
              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {t("limitIndicator", { count: savedSearches.length })}
              </span>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          {/* Saved Searches List */}
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden my-2">
            {savedSearches.length === 0 ? (
              <div className="px-4 py-10 text-center space-y-2">
                <Bookmark className="size-8 text-muted-foreground/60 mx-auto" />
                <p className="text-xs font-semibold text-foreground">
                  {t("emptyTitle")}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {t("emptyList")}
                </p>
              </div>
            ) : (
              savedSearches.map((savedSearch) => {
                const isCurrent = matchesSearch(
                  currentSearchParams,
                  savedSearch,
                );
                return (
                  <div
                    key={savedSearch.id}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${
                      isCurrent ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        onApply(savedSearch);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="block truncate text-xs sm:text-sm font-semibold text-foreground hover:text-[#0069D3] transition-colors">
                          {savedSearch.name}
                        </span>
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-2 py-0.2 text-[10px] font-semibold shrink-0">
                            <Check className="size-2.5" />
                            {t("currentActive")}
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                        {searchSummary(savedSearch.searchParams)}
                      </span>
                      {savedSearch.createdAt && (
                        <span className="text-[10px] text-muted-foreground/80 block mt-0.5">
                          {t("savedAt", {
                            date: formatDate(savedSearch.createdAt),
                          })}
                        </span>
                      )}
                    </div>

                    {/* Actions: ONLY "Xem chi tiết" and "Xóa" */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-lg text-xs font-semibold text-[#0069D3] hover:bg-blue-50 dark:hover:bg-blue-950/60 px-2.5"
                      >
                        <Link
                          href={`/freelancer/saved-searches/${savedSearch.id}`}
                          onClick={() => setOpen(false)}
                        >
                          {t("viewDetails")}
                        </Link>
                      </Button>

                      {canDeleteSavedSearch && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title={t("delete")}
                          aria-label={t("deleteAria", {
                            name: savedSearch.name,
                          })}
                          onClick={() => setDeletingItem(savedSearch)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dialog Footer Link */}
          <div className="pt-2 text-center border-t border-border/60">
            <Button
              asChild
              variant="ghost"
              className="w-full rounded-full text-xs text-[#0069D3] dark:text-blue-400 hover:text-[#005bb8]"
              onClick={() => setOpen(false)}
            >
              <Link
                href="/freelancer/saved-searches"
                className="inline-flex items-center justify-center gap-1.5"
              >
                <span>{t("manageTitle")}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deletingItem ? (
        <Dialog
          open
          onOpenChange={(nextOpen) => !nextOpen && setDeletingItem(null)}
        >
          <DialogContent className="sm:max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl font-sans">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {t("deleteTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("deleteHint", { name: deletingItem.name })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                disabled={isSubmitting}
                onClick={() => setDeletingItem(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full text-xs font-semibold"
                disabled={isSubmitting}
                onClick={handleDelete}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    {t("deleting")}
                  </>
                ) : (
                  t("delete")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

// ==========================================
// Backward compatibility wrapper
// ==========================================
export function SaveSearchDialog({
  searchParams,
  savedSearches = [],
  onApply,
  onChanged,
}: {
  searchParams: Record<string, string>;
  savedSearches: SavedSearchType[];
  onApply: (savedSearch: SavedSearchType) => void;
  onChanged?: (updatedItem?: SavedSearchType) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <SaveSearchModal
        searchParams={searchParams}
        savedSearches={savedSearches}
        onSaved={onChanged}
      />
      <SavedSearchesDialog
        savedSearches={savedSearches}
        currentSearchParams={searchParams}
        onApply={onApply}
        onChanged={onChanged}
      />
    </div>
  );
}
