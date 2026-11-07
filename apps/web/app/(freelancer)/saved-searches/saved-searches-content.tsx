"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Bell,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "@/components/icons";

import jobAlertApiRequest from "@/apiRequests/job-alert";
import savedSearchApiRequest from "@/apiRequests/saved-search";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  BUDGET_KEYS,
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
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { SavedSearchType } from "@shared/types";

type SavedSearchesContentProps = {
  savedSearches: SavedSearchType[];
  embedded?: boolean;
  basePath?: string;
};

const PAGE_SIZE_OPTIONS = [6, 9, 12, 24];

function toFindWorkHref(
  searchParams: SavedSearchType["searchParams"],
  baseUrl = "/find-work",
) {
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
  return query ? `${baseUrl}?${query}` : baseUrl;
}

export function SavedSearchesContent({
  savedSearches: initialSavedSearches,
  embedded = false,
  basePath,
}: SavedSearchesContentProps) {
  const t = useTranslations("savedSearches");
  const tFindWork = useTranslations("findWork");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const [items, setItems] = useState<SavedSearchType[]>(initialSavedSearches);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  // Rename Dialog State
  const [editingItem, setEditingItem] = useState<SavedSearchType | null>(null);
  const [editName, setEditName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Dialog State
  const [deletingItem, setDeletingItem] = useState<SavedSearchType | null>(null);

  const filterSummary = (searchParams: SavedSearchType["searchParams"]) => {
    const labels: string[] = [];
    const keyword = searchParams.keyword;
    const budget = searchParams.budget;
    const time = searchParams.time;

    if (typeof keyword === "string" && keyword) labels.push(keyword);
    if (typeof budget === "string" && budget !== "all")
      labels.push(translateFilterOption(tFindWork, BUDGET_KEYS, budget));
    if (typeof time === "string" && time !== "all")
      labels.push(translateFilterOption(tFindWork, TIME_KEYS, time));

    return labels.length ? labels : [t("allOpenProjects")];
  };

  const formatDate = (value: string | Date) =>
    format.dateTime(new Date(value), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const effectiveBasePath =
    basePath ?? (embedded ? "/freelancer/saved-searches" : "/saved-searches");
  const findWorkBaseUrl = embedded ? "/freelancer/find-work" : "/find-work";

  // Filter & Sort
  const filteredItems = useMemo(() => {
    let result = [...items];
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(query),
      );
    }
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    });
    return result;
  }, [items, searchQuery, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, validCurrentPage, pageSize]);

  // Rename Handler
  const handleStartRename = (item: SavedSearchType) => {
    setEditingItem(item);
    setEditName(item.name);
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim()) return;

    const trimmed = editName.trim();
    setIsSubmitting(true);
    try {
      await savedSearchApiRequest.update(editingItem.id, { name: trimmed });
      setItems((prev) =>
        prev.map((it) => (it.id === editingItem.id ? { ...it, name: trimmed } : it)),
      );
      toastSuccess({ message: t("updated") });
      setEditingItem(null);
      setEditName("");
    } catch {
      toastError({ message: t("updateFailed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    const targetId = deletingItem.id;
    const previousItems = [...items];

    // Optimistic Update
    setItems((prev) => prev.filter((it) => it.id !== targetId));
    setIsSubmitting(true);

    try {
      await savedSearchApiRequest.delete(targetId);
      toastSuccess({ message: t("deleted") });
      setDeletingItem(null);
    } catch {
      // Rollback on failure
      setItems(previousItems);
      toastError({ message: t("deleteFailed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAlertFromSavedSearch = async (savedSearch: SavedSearchType) => {
    try {
      const keyword =
        typeof savedSearch.searchParams.keyword === "string"
          ? savedSearch.searchParams.keyword
          : undefined;
      const skills = Array.isArray(savedSearch.searchParams.skills)
        ? (savedSearch.searchParams.skills as string[])
        : [];

      if (!keyword && skills.length === 0) {
        toastError({
          message: "Bộ lọc này không có từ khoá hoặc kỹ năng để tạo thông báo.",
        });
        return;
      }

      await jobAlertApiRequest.create({
        name: savedSearch.name,
        keywords: keyword || null,
        skills,
        frequency: "DAILY",
        channels: ["IN_APP"],
      });
      toastSuccess({ message: "Đã tạo thông báo việc làm từ bộ lọc này!" });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      toastError({ message: msg || "Không thể tạo thông báo việc làm." });
    }
  };

  return (
    <div
      className={`flex flex-col bg-background font-sans ${
        embedded ? "min-h-0 flex-1" : "min-h-dvh"
      }`}
    >
      {!embedded && <Header role="FREELANCER" />}

      <main className="flex-1">
        {/* Banner Section */}
        <section
          className={
            embedded
              ? "border-b border-border bg-background"
              : "border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]"
          }
        >
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {!embedded && (
              <nav className="text-sm text-foreground/60">
                <Link
                  href="/"
                  className="transition-colors hover:text-[#4fae2e]"
                >
                  {tCommon("home")}
                </Link>
                <span className="mx-2 text-foreground/35">/</span>
                <span className="font-medium text-foreground">
                  {t("breadcrumb")}
                </span>
              </nav>
            )}
            <div
              className={`${
                !embedded ? "mt-4" : ""
              } flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between`}
            >
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                  <BookmarkCheck className="size-6 text-[#4fae2e]" />
                  {t("title")}
                </h1>
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  {t("subtitle")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-black/5 dark:bg-white/10 px-2.5 py-1 text-xs font-semibold text-foreground">
                  {items.length}/30
                </span>
                <p className="text-xs text-muted-foreground">
                  {t("count", { count: items.length })}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {items.length > 0 && (
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search by Name */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-9 h-10 rounded-full border-border bg-card"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Controls: Sort & Page Size */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Sort toggle */}
                <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                  <ArrowUpDown className="size-3.5 text-[#4fae2e]" />
                  <span className="font-medium text-foreground">{t("sortBy")}:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                      setCurrentPage(1);
                    }}
                    className="cursor-pointer font-semibold text-[#4fae2e] hover:underline"
                  >
                    {sortOrder === "desc" ? t("sortNewest") : t("sortOldest")}
                  </button>
                </div>

                {/* Page Size selector */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>{t("perPage")}:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-[#4fae2e]"
                  >
                    {PAGE_SIZE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            /* Empty State: No saved searches */
            <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                <BookmarkCheck className="size-7" />
              </div>
              <h2 className="text-lg font-medium text-foreground">
                {t("emptyTitle")}
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {t("emptyHint")}
              </p>
              <Button
                asChild
                className="mt-6 rounded-full bg-[#4fae2e] text-white hover:bg-[#459928]"
              >
                <Link href={findWorkBaseUrl}>{t("findWork")}</Link>
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            /* Empty State: Search yielded no results */
            <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="size-6" />
              </div>
              <h3 className="text-base font-medium text-foreground">
                {t("noResults")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                &ldquo;{searchQuery}&rdquo;
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
              >
                {t("clearSearch")}
              </Button>
            </div>
          ) : (
            /* Cards Grid */
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {paginatedItems.map((savedSearch) => {
                  const filters = filterSummary(savedSearch.searchParams);
                  return (
                    <article
                      key={savedSearch.id}
                      className="group flex min-h-56 flex-col rounded-xl border border-border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#4fae2e]/40 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                          <SlidersHorizontal className="size-5" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground mr-1">
                            {t("savedAt", {
                              date: formatDate(savedSearch.createdAt),
                            })}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-[#4fae2e] hover:bg-[#eaf8df] dark:hover:bg-[#4fae2e]/15"
                            aria-label="Tạo thông báo việc làm"
                            title="Tạo thông báo việc làm từ bộ lọc này"
                            onClick={() => handleCreateAlertFromSavedSearch(savedSearch)}
                          >
                            <Bell className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            aria-label={t("renameAria", { name: savedSearch.name })}
                            onClick={() => handleStartRename(savedSearch)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                            aria-label={t("deleteAria", { name: savedSearch.name })}
                            onClick={() => setDeletingItem(savedSearch)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground line-clamp-2">
                        {savedSearch.name}
                      </h2>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {filters.map((filter) => (
                          <Badge
                            key={filter}
                            variant="secondary"
                            className="max-w-full truncate text-[11px] font-normal"
                          >
                            {filter}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-auto pt-5 flex flex-col gap-2">
                        <Button
                          asChild
                          className="w-full rounded-lg bg-[#4fae2e] text-white hover:bg-[#459928] text-xs font-semibold h-9"
                        >
                          <Link
                            href={toFindWorkHref(
                              savedSearch.searchParams,
                              findWorkBaseUrl,
                            )}
                          >
                            <Search className="mr-1.5 size-3.5" />
                            {t("viewMatchingJobs")}
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          className="w-full rounded-lg text-foreground/70 hover:text-foreground text-xs h-8"
                        >
                          <Link href={`${effectiveBasePath}/${savedSearch.id}`}>
                            {t("viewDetails")}
                          </Link>
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination bar */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
                  <p className="text-xs text-muted-foreground">
                    {t("pageOf", { current: validCurrentPage, total: totalPages })} (
                    {filteredItems.length} {t("count", { count: filteredItems.length })})
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1 text-xs"
                      disabled={validCurrentPage <= 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                      <ChevronLeft className="size-3.5" />
                      {t("paginationPrev")}
                    </Button>
                    <span className="px-2 text-xs font-semibold text-foreground">
                      {validCurrentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full gap-1 text-xs"
                      disabled={validCurrentPage >= totalPages}
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                    >
                      {t("paginationNext")}
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Rename Dialog */}
      {editingItem && (
        <Dialog open onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent className="sm:max-w-md rounded-[24px] border border-border bg-card p-6 shadow-xl font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                {t("rename")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("namePlaceholder")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveRename} className="mt-3 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="rename-input" className="text-xs font-semibold">
                  {t("nameLabel")}
                </Label>
                <Input
                  id="rename-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={100}
                  className="rounded-full bg-background text-sm"
                  autoFocus
                  required
                />
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  disabled={isSubmitting}
                  onClick={() => setEditingItem(null)}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  className="rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] text-xs font-semibold"
                  disabled={isSubmitting || !editName.trim()}
                >
                  {isSubmitting ? t("saving") : t("saveChanges")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingItem && (
        <Dialog open onOpenChange={(open) => !open && setDeletingItem(null)}>
          <DialogContent className="sm:max-w-sm rounded-[24px] border border-border bg-card p-6 shadow-xl font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                {t("deleteTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {t("deleteHint", { name: deletingItem.name })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                className="rounded-full text-xs"
                disabled={isSubmitting}
                onClick={() => setDeletingItem(null)}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                className="rounded-full text-xs font-semibold"
                disabled={isSubmitting}
                onClick={handleDeleteConfirm}
              >
                {isSubmitting ? t("deleting") : t("delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!embedded && <Footer />}
    </div>
  );
}
