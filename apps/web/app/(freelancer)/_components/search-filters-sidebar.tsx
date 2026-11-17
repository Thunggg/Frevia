"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
  Search,
  X,
} from "@/components/icons";
import jobApiRequest from "@/apiRequests/job";
import { Checkbox } from "@repo/ui/components/shadcn/checkbox";
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
  onFiltersChange?: (
    updates: Record<string, string | number | null | undefined>,
  ) => void;
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
  onFiltersChange,
  onClearFilters,
}: SearchFiltersSidebarProps) {
  const t = useTranslations("findWork");

  const applyUpdates = (
    updates: Record<string, string | number | null | undefined>,
  ) => {
    if (onFiltersChange) {
      onFiltersChange(updates);
    } else {
      for (const [key, value] of Object.entries(updates)) {
        onFilterChange(
          key,
          value === null || value === undefined ? null : String(value),
        );
      }
    }
  };

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

  // Custom budget inputs
  const [minInput, setMinInput] = useState(selectedBudgetMin);
  const [maxInput, setMaxInput] = useState(selectedBudgetMax);

  // Category Popover / Dropdown state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  // Skill Searchable Multi-select state
  const [isSkillMenuOpen, setIsSkillMenuOpen] = useState(false);
  const [skillSearchText, setSkillSearchText] = useState("");
  const [skillOptions, setSkillOptions] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [isSearchingSkills, setIsSearchingSkills] = useState(false);
  const skillContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMinInput(selectedBudgetMin);
  }, [selectedBudgetMin]);

  useEffect(() => {
    setMaxInput(selectedBudgetMax);
  }, [selectedBudgetMax]);

  // Parse active category slugs
  const selectedCategorySlugs = (selectedCategory || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && s !== "all");

  // Parse active skills
  const selectedSkills = (selectedSkill || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Outside click listener for Category popover
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        categoryContainerRef.current &&
        !categoryContainerRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };
    if (isCategoryOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isCategoryOpen]);

  // Outside click listener for Skill dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        skillContainerRef.current &&
        !skillContainerRef.current.contains(event.target as Node)
      ) {
        setIsSkillMenuOpen(false);
      }
    };
    if (isSkillMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isSkillMenuOpen]);

  // Search skills with debounce
  useEffect(() => {
    if (!isSkillMenuOpen) return;
    const search = skillSearchText.trim();
    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingSkills(true);
      try {
        const res = await jobApiRequest.searchSkills(search);
        if (!cancelled && res.success && Array.isArray(res.data)) {
          setSkillOptions(res.data);
        }
      } catch {
        if (!cancelled) setSkillOptions([]);
      } finally {
        if (!cancelled) setIsSearchingSkills(false);
      }
    }, search ? 200 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [skillSearchText, isSkillMenuOpen]);

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleApplyCustomBudget = () => {
    const minVal = minInput.trim() ? minInput.trim() : null;
    const maxVal = maxInput.trim() ? maxInput.trim() : null;
    applyUpdates({
      budget: null,
      budgetMin: minVal,
      budgetMax: maxVal,
    });
  };

  const toggleCategory = (slug: string) => {
    const isChecked = selectedCategorySlugs.includes(slug);
    const next = isChecked
      ? selectedCategorySlugs.filter((s) => s !== slug)
      : [...selectedCategorySlugs, slug];
    applyUpdates({ category: next.length > 0 ? next.join(",") : null });
  };

  const handleAddSkill = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    if (!selectedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      const next = [...selectedSkills, trimmed];
      applyUpdates({ skill: next.join(",") });
    }
    setSkillSearchText("");
  };

  const handleRemoveSkill = (skillName: string) => {
    const next = selectedSkills.filter(
      (s) => s.toLowerCase() !== skillName.toLowerCase(),
    );
    applyUpdates({ skill: next.length > 0 ? next.join(",") : null });
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearch.trim().toLowerCase()),
  );

  const hasActiveFilters = Boolean(
    selectedCategorySlugs.length > 0 ||
      (selectedBudget && selectedBudget !== "all") ||
      selectedBudgetMin ||
      selectedBudgetMax ||
      (selectedTime && selectedTime !== "all") ||
      (selectedHiringType && selectedHiringType !== "all") ||
      selectedSkills.length > 0,
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

      {/* 1. Category Filter (Popover / Dropdown with Search & Checkbox) */}
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
          <div ref={categoryContainerRef} className="relative mt-3">
            {/* Popover / Dropdown Trigger */}
            <button
              type="button"
              onClick={() => setIsCategoryOpen((prev) => !prev)}
              aria-expanded={isCategoryOpen}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:border-emerald-500/60 transition-colors cursor-pointer"
            >
              <span className="truncate pr-2">
                {selectedCategorySlugs.length === 0
                  ? t("sidebar.allCategories")
                  : selectedCategorySlugs.length === 1
                    ? (categories.find(
                        (c) => c.slug === selectedCategorySlugs[0],
                      )?.name ?? selectedCategorySlugs[0])
                    : t("sidebar.categoriesSelected", {
                        count: selectedCategorySlugs.length,
                      })}
              </span>
              <ChevronDown
                className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  isCategoryOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Popover Content */}
            {isCategoryOpen && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1.5 rounded-2xl border border-border bg-card p-2.5 shadow-xl space-y-2">
                {/* Search box inside popover */}
                <div className="relative flex items-center">
                  <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder={t("sidebar.searchCategory")}
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  {categorySearch && (
                    <button
                      type="button"
                      onClick={() => setCategorySearch("")}
                      className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {/* List with Checkboxes */}
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 text-xs">
                  {/* All Categories Option */}
                  <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/70 transition-colors cursor-pointer">
                    <Checkbox
                      checked={selectedCategorySlugs.length === 0}
                      onCheckedChange={() => {
                        applyUpdates({ category: null });
                      }}
                    />
                    <span className="font-medium text-foreground">
                      {t("sidebar.allCategories")}
                    </span>
                  </label>

                  {filteredCategories.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                      {t("sidebar.noCategoriesFound")}
                    </p>
                  ) : (
                    filteredCategories.map((cat) => {
                      const isChecked = selectedCategorySlugs.includes(
                        cat.slug,
                      );
                      return (
                        <label
                          key={cat.id}
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/70 transition-colors cursor-pointer"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleCategory(cat.slug)}
                          />
                          <span className="truncate text-foreground">
                            {cat.name}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Selected category chips */}
            {selectedCategorySlugs.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {selectedCategorySlugs.map((slug) => {
                  const cat = categories.find((c) => c.slug === slug);
                  return (
                    <span
                      key={slug}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground"
                    >
                      <span className="truncate max-w-[140px]">
                        {cat?.name ?? slug}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCategory(slug)}
                        className="hover:opacity-70 cursor-pointer"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
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
                          applyUpdates({ budget: null });
                        } else {
                          applyUpdates({
                            budget: preset.key,
                            budgetMin: null,
                            budgetMax: null,
                          });
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
                      applyUpdates({
                        hiringType: type.key === "all" ? null : type.key,
                      });
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
                      applyUpdates({
                        time: opt.key === "all" ? null : opt.key,
                      });
                    }}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Skill Filter (Searchable Multi-select) */}
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
          <div ref={skillContainerRef} className="relative mt-3 space-y-2">
            {/* Search Input for skills */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder={t("sidebar.skillPlaceholder")}
                value={skillSearchText}
                onFocus={() => setIsSkillMenuOpen(true)}
                onChange={(e) => {
                  setSkillSearchText(e.target.value);
                  setIsSkillMenuOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = skillSearchText.trim();
                    if (trimmed) {
                      handleAddSkill(trimmed);
                    }
                  }
                }}
                className="w-full rounded-xl border border-border bg-card pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {isSearchingSkills ? (
                <Loader2 className="absolute right-2.5 size-3.5 animate-spin text-muted-foreground" />
              ) : skillSearchText ? (
                <button
                  type="button"
                  onClick={() => setSkillSearchText("")}
                  className="absolute right-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>

            {/* Dropdown menu with search results & checkboxes */}
            {isSkillMenuOpen && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1.5 rounded-2xl border border-border bg-card p-2 shadow-2xl max-h-56 overflow-y-auto space-y-1 text-xs">
                {/* Option to add custom skill if typed and not exactly matching */}
                {skillSearchText.trim() &&
                  !skillOptions.some(
                    (s) =>
                      s.name.toLowerCase() ===
                      skillSearchText.trim().toLowerCase(),
                  ) && (
                    <button
                      type="button"
                      onClick={() => handleAddSkill(skillSearchText.trim())}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-muted/70 transition-colors cursor-pointer"
                    >
                      <span className="font-bold">+</span>
                      <span className="truncate">
                        {t("sidebar.addCustomSkill", {
                          name: skillSearchText.trim(),
                        })}
                      </span>
                    </button>
                  )}

                {skillOptions.length === 0 && !isSearchingSkills ? (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                    {t("sidebar.noSkillsFound")}
                  </p>
                ) : (
                  skillOptions.map((opt) => {
                    const isChecked = selectedSkills.some(
                      (s) => s.toLowerCase() === opt.name.toLowerCase(),
                    );
                    return (
                      <label
                        key={opt.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/70 transition-colors cursor-pointer"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleAddSkill(opt.name);
                            } else {
                              handleRemoveSkill(opt.name);
                            }
                          }}
                        />
                        <span className="truncate text-foreground">
                          {opt.name}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            )}

            {/* Selected skill chips */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedSkills.map((sk) => (
                  <span
                    key={sk}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-medium"
                  >
                    <span className="truncate max-w-[120px]">{sk}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(sk)}
                      className="hover:opacity-70 cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {selectedSkills.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      applyUpdates({ skill: null });
                    }}
                    className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer px-1 py-0.5"
                  >
                    {t("clearSearch")}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
