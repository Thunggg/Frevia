"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronDown, ChevronUp } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import type { JobCategoryBrowseItemType } from "@shared/types";

export interface HomeFiltersState {
  category?: string | null;
  budget?: string | null;
  budgetType?: "FIXED_PRICE" | null;
  proposals?: string[] | null;
  verified?: boolean | null;
  hiringType?: "SINGLE" | "MULTIPLE" | null;
  time?: string | null;
}

interface HomeFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: JobCategoryBrowseItemType[];
  currentFilters: HomeFiltersState;
  onApply: (filters: HomeFiltersState) => void;
}

const PROPOSAL_DEFS = [
  { id: "fewer-than-5", key: "modal.proposalsFewerThan5" },
  { id: "5-to-10", key: "modal.proposals5To10" },
  { id: "10-to-15", key: "modal.proposals10To15" },
  { id: "15-to-20", key: "modal.proposals15To20" },
  { id: "20-to-50", key: "modal.proposals20To50" },
] as const;

const BUDGET_DEFS = [
  { id: "under-500", key: "modal.under500" },
  { id: "500-1000", key: "modal.500to1000" },
  { id: "1000-5000", key: "modal.1000to5000" },
  { id: "5000-plus", key: "modal.over5000" },
] as const;

const TIME_DEFS = [
  { id: "today", key: "modal.today" },
  { id: "last-3-days", key: "modal.last3Days" },
  { id: "last-7-days", key: "modal.last7Days" },
  { id: "last-30-days", key: "modal.last30Days" },
] as const;

export function HomeFiltersModal({
  open,
  onOpenChange,
  categories = [],
  currentFilters,
  onApply,
}: HomeFiltersModalProps) {
  const t = useTranslations("findWork");

  // Local temporary states for modal before applying
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    currentFilters.category ?? null,
  );
  const [selectedBudget, setSelectedBudget] = useState<string | null>(
    currentFilters.budget ?? null,
  );
  const [selectedProposals, setSelectedProposals] = useState<string[]>(
    currentFilters.proposals ?? [],
  );
  const [selectedHiringType, setSelectedHiringType] = useState<"SINGLE" | "MULTIPLE" | null>(
    currentFilters.hiringType ?? null,
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(
    currentFilters.time ?? null,
  );

  // Accordion sections
  const [openSections, setOpenSections] = useState({
    hiringType: true,
    proposals: true,
    budget: true,
    datePosted: true,
    category: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Sync when modal opens
  useEffect(() => {
    if (open) {
      setSelectedCategory(currentFilters.category ?? null);
      setSelectedBudget(currentFilters.budget ?? null);
      setSelectedProposals(currentFilters.proposals ?? []);
      setSelectedHiringType(currentFilters.hiringType ?? null);
      setSelectedTime(currentFilters.time ?? null);
    }
  }, [open, currentFilters]);

  const toggleProposal = (id: string) => {
    setSelectedProposals((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleClearAll = () => {
    setSelectedCategory(null);
    setSelectedBudget(null);
    setSelectedProposals([]);
    setSelectedHiringType(null);
    setSelectedTime(null);
  };

  // Build active chips (shown at the top, matching the screenshot with text and checkmark)
  const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

  for (const propId of selectedProposals) {
    const found = PROPOSAL_DEFS.find((p) => p.id === propId);
    chips.push({
      id: `prop-${propId}`,
      label: found ? t(found.key) : propId,
      onRemove: () => toggleProposal(propId),
    });
  }

  if (selectedHiringType) {
    chips.push({
      id: `hiring-${selectedHiringType}`,
      label:
        selectedHiringType === "SINGLE"
          ? t("modal.hiringTypeSingle")
          : t("modal.hiringTypeMultiple"),
      onRemove: () => setSelectedHiringType(null),
    });
  }

  if (selectedBudget) {
    const found = BUDGET_DEFS.find((b) => b.id === selectedBudget);
    chips.push({
      id: `budget-${selectedBudget}`,
      label: found ? t(found.key) : selectedBudget,
      onRemove: () => setSelectedBudget(null),
    });
  }

  if (selectedTime) {
    const found = TIME_DEFS.find((t) => t.id === selectedTime);
    chips.push({
      id: `time-${selectedTime}`,
      label: found ? t(found.key) : selectedTime,
      onRemove: () => setSelectedTime(null),
    });
  }

  if (selectedCategory) {
    const found = categories.find((c) => c.slug === selectedCategory);
    chips.push({
      id: `cat-${selectedCategory}`,
      label: found ? found.name : selectedCategory,
      onRemove: () => setSelectedCategory(null),
    });
  }

  const activeCount = chips.length;

  const handleApply = () => {
    onApply({
      category: selectedCategory,
      budget: selectedBudget,
      budgetType: null,
      proposals: selectedProposals.length > 0 ? selectedProposals : null,
      verified: null,
      hiringType: selectedHiringType,
      time: selectedTime,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl font-sans">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-border/60">
          <div className="flex items-start justify-between">
            <div className="space-y-1 text-left">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {t("modal.title")}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {t("modal.subtitle")}
              </p>
            </div>
          </div>

          {/* Active Chips Row (as shown in Upwork UI) */}
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-3">
              {chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-3.5 py-1 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                  title={t("modal.clickToRemove")}
                >
                  <span>{chip.label}</span>
                  <Check className="size-3.5 text-zinc-600 dark:text-zinc-300" />
                </button>
              ))}
            </div>
          )}
        </DialogHeader>

        {/* Scrollable Filter Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Section 1: Hiring Type (Real schema field) */}
          <div className="border-b border-border/60 pb-5">
            <button
              type="button"
              onClick={() => toggleSection("hiringType")}
              className="flex w-full items-center justify-between font-semibold text-sm text-foreground hover:text-[#0069D3] transition-colors cursor-pointer"
            >
              <span>{t("modal.hiringType")}</span>
              {openSections.hiringType ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>

            {openSections.hiringType && (
              <div className="mt-3.5 space-y-2.5">
                <label className="flex items-center gap-3 text-xs text-foreground/80 hover:text-foreground cursor-pointer">
                  <Checkbox
                    checked={selectedHiringType === "SINGLE"}
                    onCheckedChange={(checked) =>
                      setSelectedHiringType(checked ? "SINGLE" : null)
                    }
                  />
                  <span>{t("modal.hiringTypeSingle")}</span>
                </label>
                <label className="flex items-center gap-3 text-xs text-foreground/80 hover:text-foreground cursor-pointer">
                  <Checkbox
                    checked={selectedHiringType === "MULTIPLE"}
                    onCheckedChange={(checked) =>
                      setSelectedHiringType(checked ? "MULTIPLE" : null)
                    }
                  />
                  <span>{t("modal.hiringTypeMultiple")}</span>
                </label>
              </div>
            )}
          </div>

          {/* Section 2: Number of proposals */}
          <div className="border-b border-border/60 pb-5">
            <button
              type="button"
              onClick={() => toggleSection("proposals")}
              className="flex w-full items-center justify-between font-semibold text-sm text-foreground hover:text-[#0069D3] transition-colors cursor-pointer"
            >
              <span>{t("modal.proposals")}</span>
              {openSections.proposals ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>

            {openSections.proposals && (
              <div className="mt-3.5 space-y-2.5">
                {PROPOSAL_DEFS.map((item) => {
                  const isChecked = selectedProposals.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 text-xs text-foreground/80 hover:text-foreground cursor-pointer"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleProposal(item.id)}
                      />
                      <span>{t(item.key)}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Budget Range */}
          <div className="border-b border-border/60 pb-5">
            <button
              type="button"
              onClick={() => toggleSection("budget")}
              className="flex w-full items-center justify-between font-semibold text-sm text-foreground hover:text-[#0069D3] transition-colors cursor-pointer"
            >
              <span>{t("modal.budgetRange")}</span>
              {openSections.budget ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>

            {openSections.budget && (
              <div className="mt-3.5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BUDGET_DEFS.map((item) => {
                    const isChecked = selectedBudget === item.id;
                    return (
                      <label
                        key={item.id}
                        className="flex items-center gap-2.5 text-xs text-foreground/80 hover:text-foreground cursor-pointer"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            setSelectedBudget(checked ? item.id : null)
                          }
                        />
                        <span>{t(item.key)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Date Posted */}
          <div className="border-b border-border/60 pb-5">
            <button
              type="button"
              onClick={() => toggleSection("datePosted")}
              className="flex w-full items-center justify-between font-semibold text-sm text-foreground hover:text-[#0069D3] transition-colors cursor-pointer"
            >
              <span>{t("modal.datePosted")}</span>
              {openSections.datePosted ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>

            {openSections.datePosted && (
              <div className="mt-3.5 grid grid-cols-2 gap-2">
                {TIME_DEFS.map((item) => {
                  const isChecked = selectedTime === item.id;
                  return (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 text-xs text-foreground/80 hover:text-foreground cursor-pointer"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          setSelectedTime(checked ? item.id : null)
                        }
                      />
                      <span>{t(item.key)}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 6: Category (Real categories from DB) */}
          {categories.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => toggleSection("category")}
                className="flex w-full items-center justify-between font-semibold text-sm text-foreground hover:text-[#0069D3] transition-colors cursor-pointer"
              >
                <span>{t("modal.category", { count: categories.length })}</span>
                {openSections.category ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </button>

              {openSections.category && (
                <div className="mt-3.5 max-h-48 overflow-y-auto space-y-2 pr-2">
                  {categories.map((cat) => {
                    const isChecked = selectedCategory === cat.slug;
                    return (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2.5 text-xs text-foreground/80 hover:text-foreground cursor-pointer"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            setSelectedCategory(checked ? cat.slug : null)
                          }
                        />
                        <span>{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 px-6 border-t border-border/60 bg-muted/20 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {t("modal.clear")}
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white px-6 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {activeCount > 0
              ? t("modal.applyWithCount", { count: activeCount })
              : t("modal.apply")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
