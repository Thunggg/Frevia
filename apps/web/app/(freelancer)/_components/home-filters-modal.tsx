"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, ChevronUp, X } from "@/components/icons";
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
}

interface HomeFiltersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: JobCategoryBrowseItemType[];
  currentFilters: HomeFiltersState;
  onApply: (filters: HomeFiltersState) => void;
}

const PROPOSAL_OPTIONS = [
  { id: "fewer-than-5", label: "Fewer than 5" },
  { id: "5-to-10", label: "5 to 10 Proposals" },
  { id: "10-to-15", label: "10 to 15 Proposals" },
  { id: "15-to-20", label: "15 to 20 Proposals" },
  { id: "20-to-50", label: "20 to 50 Proposals" },
];

const BUDGET_OPTIONS = [
  { id: "under-500", label: "Less than $500" },
  { id: "500-1000", label: "$500 to $1,000" },
  { id: "1000-5000", label: "$1,000 to $5,000" },
  { id: "5000-plus", label: "$5,000+" },
];

export function HomeFiltersModal({
  open,
  onOpenChange,
  categories = [],
  currentFilters,
  onApply,
}: HomeFiltersModalProps) {
  // Local temporary states for modal before applying
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    currentFilters.category ?? null,
  );
  const [selectedBudget, setSelectedBudget] = useState<string | null>(
    currentFilters.budget ?? null,
  );
  const [selectedBudgetType, setSelectedBudgetType] = useState<"FIXED_PRICE" | null>(
    currentFilters.budgetType ?? null,
  );
  const [selectedProposals, setSelectedProposals] = useState<string[]>(
    currentFilters.proposals ?? [],
  );
  const [verifiedClient, setVerifiedClient] = useState<boolean>(
    Boolean(currentFilters.verified),
  );

  // Accordion sections
  const [openSections, setOpenSections] = useState({
    clientInfo: true,
    jobType: true,
    proposals: true,
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
      setSelectedBudgetType(currentFilters.budgetType ?? null);
      setSelectedProposals(currentFilters.proposals ?? []);
      setVerifiedClient(Boolean(currentFilters.verified));
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
    setSelectedBudgetType(null);
    setSelectedProposals([]);
    setVerifiedClient(false);
  };

  // Build active chips
  const chips: Array<{ id: string; label: string; onRemove: () => void }> = [];

  if (verifiedClient) {
    chips.push({
      id: "verified",
      label: "Payment verified",
      onRemove: () => setVerifiedClient(false),
    });
  }

  if (selectedBudgetType) {
    chips.push({
      id: `budgetType-${selectedBudgetType}`,
      label: "Fixed-Price",
      onRemove: () => setSelectedBudgetType(null),
    });
  }

  if (selectedBudget) {
    const found = BUDGET_OPTIONS.find((b) => b.id === selectedBudget);
    chips.push({
      id: `budget-${selectedBudget}`,
      label: found ? found.label : selectedBudget,
      onRemove: () => setSelectedBudget(null),
    });
  }

  for (const propId of selectedProposals) {
    const found = PROPOSAL_OPTIONS.find((p) => p.id === propId);
    chips.push({
      id: `prop-${propId}`,
      label: found ? found.label : propId,
      onRemove: () => toggleProposal(propId),
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
      budgetType: selectedBudgetType,
      proposals: selectedProposals.length > 0 ? selectedProposals : null,
      verified: verifiedClient ? true : null,
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
                Filters
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Filters will only apply to &quot;Best match&quot; and &quot;Most recent&quot; searches.
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
                  className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3.5 py-1 text-xs font-semibold text-foreground transition-colors cursor-pointer"
                >
                  <span>{chip.label}</span>
                  <Check className="size-3 text-emerald-600" />
                </button>
              ))}
            </div>
          )}
        </DialogHeader>

        {/* Scrollable Filter Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Section 1: Client info */}
          <div className="border-b border-border/60 pb-5">
            <button
              type="button"
              onClick={() => toggleSection("clientInfo")}
              className="flex w-full items-center justify-between font-semibold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
            >
              <span>Client info</span>
              {openSections.clientInfo ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>

            {openSections.clientInfo && (
              <div className="mt-3.5 space-y-2.5">
                <label className="flex items-center gap-3 text-xs text-foreground/80 hover:text-foreground cursor-pointer">
                  <Checkbox
                    checked={verifiedClient}
                    onCheckedChange={(checked) =>
                      setVerifiedClient(Boolean(checked))
                    }
                  />
                  <span>Payment verified</span>
                </label>
              </div>
            )}
          </div>

          {/* Section 2: Number of proposals */}
          <div className="border-b border-border/60 pb-5">
            <button
              type="button"
              onClick={() => toggleSection("proposals")}
              className="flex w-full items-center justify-between font-semibold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
            >
              <span>Number of proposals</span>
              {openSections.proposals ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>

            {openSections.proposals && (
              <div className="mt-3.5 space-y-2.5">
                {PROPOSAL_OPTIONS.map((item) => {
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
                      <span>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Job type & Budget */}
          <div className="border-b border-border/60 pb-5">
            <button
              type="button"
              onClick={() => toggleSection("jobType")}
              className="flex w-full items-center justify-between font-semibold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
            >
              <span>Job type & Budget</span>
              {openSections.jobType ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </button>

            {openSections.jobType && (
              <div className="mt-3.5 space-y-4">
                {/* Budget Type */}
                <div className="space-y-2.5">
                  <span className="text-xs font-medium text-muted-foreground">Loại công việc:</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs text-foreground/80 hover:text-foreground cursor-pointer">
                      <Checkbox
                        checked={selectedBudgetType === "FIXED_PRICE"}
                        onCheckedChange={(checked) =>
                          setSelectedBudgetType(checked ? "FIXED_PRICE" : null)
                        }
                      />
                      <span>Fixed-Price</span>
                    </label>
                  </div>
                </div>

                {/* Budget Range */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-xs font-medium text-muted-foreground">Mức ngân sách:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BUDGET_OPTIONS.map((item) => {
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
                          <span>{item.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Category */}
          {categories.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => toggleSection("category")}
                className="flex w-full items-center justify-between font-semibold text-sm text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
              >
                <span>Category</span>
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
            Clear
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {activeCount > 0 ? `Apply (${activeCount})` : "Apply"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
