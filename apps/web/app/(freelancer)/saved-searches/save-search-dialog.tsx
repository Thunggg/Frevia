"use client";

import { useEffect, useState } from "react";
import { BookmarkPlus, Pencil, Trash2 } from "@/components/icons";

import savedSearchApiRequest from "@/apiRequests/saved-search";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { SavedSearchType } from "@shared/types";

type SaveSearchDialogProps = {
  searchParams: Record<string, string>;
  savedSearches: SavedSearchType[];
  onApply: (savedSearch: SavedSearchType) => void;
  onChanged?: () => void;
};

function searchSummary(searchParams: SavedSearchType["searchParams"]) {
  const values = [
    typeof searchParams.keyword === "string" && searchParams.keyword,
    typeof searchParams.budget === "string" &&
      searchParams.budget !== "all" &&
      searchParams.budget.replaceAll("-", " "),
    typeof searchParams.time === "string" &&
      searchParams.time !== "all" &&
      searchParams.time.replaceAll("-", " "),
  ].filter(Boolean);
  return values.length ? values.join(" / ") : "All open projects";
}

function normalizedSearchParams(searchParams: Record<string, unknown>) {
  return Object.entries(searchParams)
    .filter(
      ([key, value]) =>
        key !== "page" && value !== "" && value !== "all" && value != null,
    )
    .sort(([left], [right]) => left.localeCompare(right));
}

function matchesSearch(
  searchParams: Record<string, string>,
  savedSearch: SavedSearchType,
) {
  return (
    JSON.stringify(normalizedSearchParams(searchParams)) ===
    JSON.stringify(normalizedSearchParams(savedSearch.searchParams))
  );
}

export function SaveSearchDialog({
  searchParams,
  savedSearches = [],
  onApply,
  onChanged,
}: SaveSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [saveConfirmationOpen, setSaveConfirmationOpen] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<SavedSearchType | null>(null);
  const [deleting, setDeleting] = useState<SavedSearchType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setEditing(null);
      setDeleting(null);
      setSaveConfirmationOpen(false);
    }
  }, [open]);

  const handleCreate = async () => {
    const keyword = searchParams.keyword?.trim();
    const defaultName = keyword || "All open projects";
    setIsSubmitting(true);
    try {
      await savedSearchApiRequest.create({ name: defaultName, searchParams });
      toastSuccess({ message: "Search saved" });
      setSaveConfirmationOpen(false);
      onChanged?.();
    } catch {
      toastError({ message: "Couldn't save this search. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRename = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing || !name.trim()) return;
    setIsSubmitting(true);
    try {
      await savedSearchApiRequest.update(editing.id, { name: name.trim() });
      toastSuccess({ message: "Saved search updated" });
      setEditing(null);
      setName("");
      onChanged?.();
    } catch {
      toastError({ message: "Couldn't update this saved search. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsSubmitting(true);
    try {
      await savedSearchApiRequest.delete(deleting.id);
      toastSuccess({ message: "Saved search deleted" });
      setDeleting(null);
      onChanged?.();
    } catch {
      toastError({ message: "Couldn't delete this saved search. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCurrentSearchSaved = savedSearches.some((savedSearch) =>
    matchesSearch(searchParams, savedSearch),
  );
  const defaultSearchName = searchParams.keyword?.trim() || "All open projects";
  const currentFilters = [
    { label: "Search", value: searchParams.keyword?.trim() || "All jobs" },
    ...(searchParams.budget && searchParams.budget !== "all"
      ? [{ label: "Budget", value: searchParams.budget.replaceAll("-", " ") }]
      : []),
    ...(searchParams.time && searchParams.time !== "all"
      ? [{ label: "Posted", value: searchParams.time.replaceAll("-", " ") }]
      : []),
    ...(searchParams.sort && searchParams.sort !== "newest"
      ? [{ label: "Sort", value: searchParams.sort.replaceAll("-", " ") }]
      : []),
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#F3F3F7] dark:bg-zinc-800/90 border border-black/5 dark:border-white/10 px-4 py-2 text-xs sm:text-sm font-medium text-foreground hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 transition-colors cursor-pointer outline-none shrink-0"
          >
            <BookmarkPlus className="size-4 text-[#4fae2e]" />
            <span>Saved Searches</span>
            {savedSearches.length > 0 && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 px-1.5 text-[11px] font-bold text-foreground">
                {savedSearches.length}
              </span>
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="max-h-[min(42rem,calc(100dvh-2rem))] overflow-y-auto sm:max-w-xl rounded-[26px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground font-sans">
              Saved searches
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Open a saved filter set, rename it, or remove it from your list.
            </DialogDescription>
          </DialogHeader>

          {editing ? (
            <form
              className="rounded-2xl border border-border bg-muted/30 p-4 font-sans"
              onSubmit={handleRename}
            >
              <div className="grid gap-2">
                <Label htmlFor="saved-search-name" className="text-xs font-semibold">
                  Saved search name
                </Label>
                <Input
                  id="saved-search-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="For example, Remote React work"
                  maxLength={100}
                  className="rounded-full bg-background"
                  autoFocus
                  required
                />
              </div>
              <DialogFooter className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => {
                    setEditing(null);
                    setName("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-full bg-[#4fae2e] text-white hover:bg-[#459928]"
                  disabled={isSubmitting || !name.trim()}
                >
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <Button
              className="w-full rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] text-xs font-semibold h-10 cursor-pointer"
              onClick={() => setSaveConfirmationOpen(true)}
              disabled={isSubmitting || isCurrentSearchSaved}
            >
              <BookmarkPlus className="size-4 mr-1.5" />
              {isCurrentSearchSaved
                ? "Current search saved"
                : "Save current search"}
            </Button>
          )}

          <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
            {savedSearches.length ? (
              savedSearches.map((savedSearch) => (
                <div
                  key={savedSearch.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      onApply(savedSearch);
                      setOpen(false);
                    }}
                  >
                    <span className="block truncate text-sm font-semibold text-foreground hover:text-[#3f9225]">
                      {savedSearch.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs capitalize text-muted-foreground">
                      {searchSummary(savedSearch.searchParams)}
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    aria-label={`Rename ${savedSearch.name}`}
                    onClick={() => {
                      setEditing(savedSearch);
                      setName(savedSearch.name);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${savedSearch.name}`}
                    onClick={() => setDeleting(savedSearch)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No saved searches yet. Save the filters you use most.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={saveConfirmationOpen}
        onOpenChange={setSaveConfirmationOpen}
      >
        <DialogContent className="sm:max-w-md rounded-[26px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-2xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground font-sans">
              Save this search?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              It will be saved as &quot;{defaultSearchName}&quot;. You can
              rename it later.
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden my-2">
            {currentFilters.map((filter) => (
              <div
                key={filter.label}
                className="flex items-center justify-between gap-4 px-4 py-2.5 text-xs"
              >
                <span className="text-muted-foreground font-medium">{filter.label}</span>
                <span className="max-w-[60%] truncate text-right font-semibold capitalize text-foreground">
                  {filter.value}
                </span>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              className="rounded-full"
              disabled={isSubmitting}
              onClick={() => setSaveConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] text-xs font-semibold"
              disabled={isSubmitting}
              onClick={handleCreate}
            >
              <BookmarkPlus className="size-4 mr-1.5" />
              {isSubmitting ? "Saving..." : "Save search"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleting ? (
        <Dialog
          open
          onOpenChange={(nextOpen) => !nextOpen && setDeleting(null)}
        >
          <DialogContent className="sm:max-w-sm rounded-[26px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-6 shadow-2xl font-sans">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground font-sans">
                Delete saved search?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-sans">
                This will permanently remove &quot;{deleting.name}&quot;. Your
                jobs and search results will not be affected.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-3 flex gap-2">
              <Button
                variant="ghost"
                className="rounded-full"
                disabled={isSubmitting}
                onClick={() => setDeleting(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-full"
                disabled={isSubmitting}
                onClick={handleDelete}
              >
                {isSubmitting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
