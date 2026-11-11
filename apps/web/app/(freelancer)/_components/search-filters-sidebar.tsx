"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, RotateCcw } from "@/components/icons";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import type { JobCategoryBrowseItemType } from "@shared/types";

export type SearchFilterValues = {
  category?: string;
  budget?: string;
  budgetMin?: string;
  budgetMax?: string;
  time?: string;
  hiringType?: string;
  skill?: string;
};

type SearchFiltersSidebarProps = {
  categories: JobCategoryBrowseItemType[];
  selectedCategory?: string;
  selectedBudget?: string;
  selectedBudgetMin?: string;
  selectedBudgetMax?: string;
  selectedTime?: string;
  selectedHiringType?: string;
  selectedSkill?: string;
  onFilterChange: (key: string, value: string | null) => void;
  onClearFilters: () => void;
};

export function SearchFiltersSidebar({
  categories = [],
  selectedCategory = "all",
  selectedBudget = "all",
  selectedBudgetMin = "",
  selectedBudgetMax = "",
  selectedTime = "all",
  selectedHiringType = "all",
  selectedSkill = "",
  onFilterChange,
  onClearFilters,
}: SearchFiltersSidebarProps) {
  const t = useTranslations("findWork");

  const BUDGET_PRESETS = [
    { key: "under-500", label: t("modal.under500") },
    { key: "500-1000", label: t("modal.500to1000") },
    { key: "1000-5000", label: t("modal.1000to5000") },
    { key: "5000-plus", label: t("modal.over5000") },
  ];

  const TIME_OPTIONS = [
    { key: "all", label: t("sidebar.allDates") },
    { key: "today", label: t("modal.today") },
    { key: "last-3-days", label: t("modal.last3Days") },
    { key: "last-7-days", label: t("modal.last7Days") },
    { key: "last-30-days", label: t("modal.last30Days") },
  ];

  const HIRING_TYPES = [
    { key: "all", label: t("sidebar.allHiringTypes") },
    { key: "SINGLE", label: t("modal.hiringTypeSingle") },
    { key: "MULTIPLE", label: t("modal.hiringTypeMultiple") },
  ];

  const [openSections, setOpenSections] = useState({
    category: true,
    budget: true,
    hiringType: true,
    time: true,
    skill: true,
  });

  const [minInput, setMinInput] = useState(selectedBudgetMin);
  const [maxInput, setMaxInput] = useState(selectedBudgetMax);
  const [skillInput, setSkillInput] = useState(selectedSkill);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleApplyCustomBudget = () => {
    const minVal = minInput.trim() ? minInput.trim() : null;
    const maxVal = maxInput.trim() ? maxInput.trim() : null;
    onFilterChange("budget", null);
    onFilterChange("budgetMin", minVal);
    onFilterChange("budgetMax", maxVal);
  };

  const handleApplySkill = (e: React.FormEvent) => {
    e.preventDefault();
    const val = skillInput.trim();
    onFilterChange("skill", val || null);
  };

  const hasActiveFilters = Boolean(
    (selectedCategory && selectedCategory !== "all") ||
      (selectedBudget && selectedBudget !== "all") ||
      selectedBudgetMin ||
      selectedBudgetMax ||
      (selectedTime && selectedTime !== "all") ||
      (selectedHiringType && selectedHiringType !== "all") ||
      selectedSkill,
  );

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-5 font-sans text-sm">
      {/* Header with Clear Action */}
      <div className="flex items-center justify-between pb-1 border-b border-border">
        <h2 className="font-bold text-base text-foreground">
          {t("sidebar.title")}
        </h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
          >
            <RotateCcw className="size-3" />
            <span>{t("sidebar.clearFilters")}</span>
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      <div className="border-b border-border/80 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("category")}
          className="flex w-full items-center justify-between font-semibold text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>{t("sidebar.category")}</span>
          {openSections.category ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {openSections.category && (
          <div className="mt-3">
            <Select
              value={selectedCategory || "all"}
              onValueChange={(val) =>
                onFilterChange("category", val === "all" ? null : val)
              }
            >
              <SelectTrigger className="w-full rounded-xl border border-border bg-card text-xs sm:text-sm font-medium">
                <SelectValue placeholder={t("sidebar.allCategories")} />
              </SelectTrigger>
              <SelectContent className="max-h-72 rounded-xl border border-border bg-card p-1 shadow-xl">
                <SelectItem
                  value="all"
                  className="rounded-lg text-xs cursor-pointer"
                >
                  {t("sidebar.allCategories")}
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

      {/* 2. Budget Filter (Fixed-Price) */}
      <div className="border-b border-border/80 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("budget")}
          className="flex w-full items-center justify-between font-semibold text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>{t("sidebar.budget")}</span>
          {openSections.budget ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {openSections.budget && (
          <div className="mt-3 space-y-2.5 text-xs">
            <div className="space-y-2">
              {BUDGET_PRESETS.map((preset) => {
                const isSelected = selectedBudget === preset.key;
                return (
                  <label
                    key={preset.key}
                    className="flex items-center gap-2 cursor-pointer text-foreground hover:text-emerald-600 transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => {
                        if (isSelected) {
                          onFilterChange("budget", null);
                        } else {
                          onFilterChange("budget", preset.key);
                          onFilterChange("budgetMin", null);
                          onFilterChange("budgetMax", null);
                          setMinInput("");
                          setMaxInput("");
                        }
                      }}
                    />
                    <span>{preset.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Custom Range Inputs */}
            <div className="pt-2 border-t border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground block mb-1.5">
                {t("sidebar.customBudget")}
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs flex-1">
                  <span className="text-muted-foreground mr-1">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={t("sidebar.min")}
                    value={minInput}
                    onChange={(e) => setMinInput(e.target.value)}
                    className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <span className="text-muted-foreground text-xs">–</span>
                <div className="flex items-center rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs flex-1">
                  <span className="text-muted-foreground mr-1">$</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={t("sidebar.max")}
                    value={maxInput}
                    onChange={(e) => setMaxInput(e.target.value)}
                    className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustomBudget}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t("sidebar.apply")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Hiring Type Filter */}
      <div className="border-b border-border/80 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("hiringType")}
          className="flex w-full items-center justify-between font-semibold text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>{t("sidebar.hiringType")}</span>
          {openSections.hiringType ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {openSections.hiringType && (
          <div className="mt-3 space-y-2 text-xs">
            {HIRING_TYPES.map((type) => {
              const isSelected = (selectedHiringType || "all") === type.key;
              return (
                <label
                  key={type.key}
                  className="flex items-center gap-2 cursor-pointer text-foreground hover:text-emerald-600 transition-colors"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => {
                      onFilterChange(
                        "hiringType",
                        type.key === "all" ? null : type.key,
                      );
                    }}
                  />
                  <span>{type.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Date Posted (Time Range) */}
      <div className="border-b border-border/80 pb-5">
        <button
          type="button"
          onClick={() => toggleSection("time")}
          className="flex w-full items-center justify-between font-semibold text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>{t("sidebar.datePosted")}</span>
          {openSections.time ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {openSections.time && (
          <div className="mt-3 space-y-2 text-xs">
            {TIME_OPTIONS.map((opt) => {
              const isSelected = (selectedTime || "all") === opt.key;
              return (
                <label
                  key={opt.key}
                  className="flex items-center gap-2 cursor-pointer text-foreground hover:text-emerald-600 transition-colors"
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => {
                      onFilterChange(
                        "time",
                        opt.key === "all" ? null : opt.key,
                      );
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Skill Filter */}
      <div className="pb-2">
        <button
          type="button"
          onClick={() => toggleSection("skill")}
          className="flex w-full items-center justify-between font-semibold text-foreground hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>{t("sidebar.skills")}</span>
          {openSections.skill ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </button>

        {openSections.skill && (
          <form onSubmit={handleApplySkill} className="mt-3 space-y-2">
            <input
              type="text"
              placeholder={t("sidebar.skillPlaceholder")}
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {selectedSkill && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t("chip.search", { value: selectedSkill })}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSkillInput("");
                    onFilterChange("skill", null);
                  }}
                  className="text-muted-foreground hover:text-destructive cursor-pointer text-[11px]"
                >
                  {t("clearSearch")}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </aside>
  );
}
