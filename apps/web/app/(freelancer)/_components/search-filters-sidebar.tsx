"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "@/components/icons";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import type { JobCategoryBrowseItemType } from "@shared/types";

type SearchFiltersSidebarProps = {
  categories: JobCategoryBrowseItemType[];
  selectedCategory?: string;
  selectedBudget?: string;
  onFilterChange: (key: string, value: string | null) => void;
};

export function SearchFiltersSidebar({
  categories = [],
  selectedCategory = "all",
  selectedBudget = "all",
  onFilterChange,
}: SearchFiltersSidebarProps) {
  // Collapsible accordion states
  const [openSections, setOpenSections] = useState({
    category: true,
    experience: true,
    jobType: true,
    proposals: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);
  const [hourlyChecked, setHourlyChecked] = useState(false);
  const [fixedPriceChecked, setFixedPriceChecked] = useState(
    selectedBudget !== "all",
  );

  const toggleExperience = (level: string) => {
    setSelectedExperience((prev) => {
      const next = prev.includes(level)
        ? prev.filter((item) => item !== level)
        : [...prev, level];
      onFilterChange("experience", next.length > 0 ? next.join(",") : null);
      return next;
    });
  };

  const toggleProposals = (bucket: string) => {
    setSelectedProposals((prev) => {
      const next = prev.includes(bucket)
        ? prev.filter((item) => item !== bucket)
        : [...prev, bucket];
      onFilterChange("proposals", next.length > 0 ? next.join(",") : null);
      return next;
    });
  };

  const handleBudgetSelect = (budgetKey: string) => {
    const nextValue = selectedBudget === budgetKey ? null : budgetKey;
    onFilterChange("budget", nextValue);
  };

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-6 font-sans text-sm">
      {/* 1. Category */}
      <div className="border-b border-border/80 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("category")}
          className="flex w-full items-center justify-between font-semibold text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>Category</span>
          {openSections.category ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {openSections.category && (
          <div className="mt-3">
            <Select
              value={selectedCategory}
              onValueChange={(val) => onFilterChange("category", val)}
            >
              <SelectTrigger className="w-full rounded-xl border border-border bg-card text-xs sm:text-sm font-medium">
                <SelectValue placeholder="Select Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-72 rounded-xl border border-border bg-card p-1 shadow-xl">
                <SelectItem value="all" className="rounded-lg text-xs cursor-pointer">
                  All Categories
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.slug}
                    className="rounded-lg text-xs cursor-pointer"
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* 2. Experience Level */}
      <div className="border-b border-border/80 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("experience")}
          className="flex w-full items-center justify-between font-semibold text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>Experience level</span>
          {openSections.experience ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {openSections.experience && (
          <div className="mt-3 space-y-2.5 text-xs text-foreground/90">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedExperience.includes("entry")}
                onCheckedChange={() => toggleExperience("entry")}
              />
              <span>Entry Level (385)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedExperience.includes("intermediate")}
                onCheckedChange={() => toggleExperience("intermediate")}
              />
              <span>Intermediate (5,335)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedExperience.includes("expert")}
                onCheckedChange={() => toggleExperience("expert")}
              />
              <span>Expert (4,131)</span>
            </label>
          </div>
        )}
      </div>

      {/* 3. Job Type (Hourly & Fixed-Price) */}
      <div className="border-b border-border/80 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("jobType")}
          className="flex w-full items-center justify-between font-semibold text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>Job type</span>
          {openSections.jobType ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {openSections.jobType && (
          <div className="mt-3 space-y-4 text-xs">
            {/* Hourly */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={hourlyChecked}
                  onCheckedChange={(checked) => setHourlyChecked(Boolean(checked))}
                />
                <span className="font-medium text-foreground">
                  Hourly (6,281)
                </span>
              </label>

              {hourlyChecked && (
                <div className="flex items-center gap-2 pl-6 pt-1">
                  <div className="flex items-center rounded-lg border border-border bg-card px-2 py-1 text-xs">
                    <span className="text-muted-foreground mr-1">$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-12 bg-transparent outline-none"
                    />
                    <span className="text-muted-foreground ml-1">/hr</span>
                  </div>
                  <div className="flex items-center rounded-lg border border-border bg-card px-2 py-1 text-xs">
                    <span className="text-muted-foreground mr-1">$</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-12 bg-transparent outline-none"
                    />
                    <span className="text-muted-foreground ml-1">/hr</span>
                  </div>
                </div>
              )}
            </div>

            {/* Fixed-Price */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={fixedPriceChecked}
                  onCheckedChange={(checked) =>
                    setFixedPriceChecked(Boolean(checked))
                  }
                />
                <span className="font-medium text-foreground">
                  Fixed-Price (3,570)
                </span>
              </label>

              <div className="space-y-2 pl-6 pt-1">
                {[
                  { key: "under-500", label: "Less than $100 (950)" },
                  { key: "500-1000", label: "$100 to $500 (1,172)" },
                  { key: "1000-5000", label: "$500 - $1K (482)" },
                  { key: "5000-plus", label: "$1K - $5K (761)" },
                  { key: "5k-plus-tier", label: "$5K+ (205)" },
                ].map((tier) => (
                  <label
                    key={tier.key}
                    className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    <Checkbox
                      checked={selectedBudget === tier.key}
                      onCheckedChange={() => handleBudgetSelect(tier.key)}
                    />
                    <span>{tier.label}</span>
                  </label>
                ))}

                <div className="flex items-center gap-2 pt-2">
                  <div className="flex items-center rounded-lg border border-border bg-card px-2 py-1 text-xs">
                    <span className="text-muted-foreground mr-1">$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-12 bg-transparent outline-none"
                    />
                  </div>
                  <div className="flex items-center rounded-lg border border-border bg-card px-2 py-1 text-xs">
                    <span className="text-muted-foreground mr-1">$</span>
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-12 bg-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Number of Proposals */}
      <div className="border-b border-border/80 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("proposals")}
          className="flex w-full items-center justify-between font-semibold text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>Number of proposals</span>
          {openSections.proposals ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {openSections.proposals && (
          <div className="mt-3 space-y-2.5 text-xs text-foreground/90">
            {[
              { id: "fewer-than-5", label: "Fewer than 5 (813)" },
              { id: "5-to-10", label: "5 to 10" },
              { id: "10-to-15", label: "10 to 15" },
              { id: "15-to-20", label: "15 to 20" },
              { id: "20-to-50", label: "20 to 50" },
            ].map((prop) => (
              <label
                key={prop.id}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={selectedProposals.includes(prop.id)}
                  onCheckedChange={() => toggleProposals(prop.id)}
                />
                <span>{prop.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

