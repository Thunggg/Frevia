"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import {
  BarChart3,
  Briefcase,
  Cloud,
  Code2,
  Cpu,
  Database,
  Globe,
  Layers,
  Megaphone,
  Palette,
  PenTool,
  Shield,
  Smartphone,
  Video,
  type LucideIcon,
} from "lucide-react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  SearchX,
  X,
} from "@/components/icons";

import { Button } from "@repo/ui/components/shadcn/button";
import type { JobCategoryBrowseItemType } from "@shared/types";

type CategoryListContentProps = {
  initialCategories: JobCategoryBrowseItemType[];
  popularCategories?: JobCategoryBrowseItemType[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  initialSearch?: string;
};

function getCategoryIcon(name: string, slug: string): LucideIcon {
  const key = `${name} ${slug}`.toLowerCase();
  if (/ui|ux|design|graphic|brand|figma|illustr/.test(key)) return Palette;
  if (/mobile|ios|android|flutter|react-native|app/.test(key)) return Smartphone;
  if (/ai|machine|ml|llm|deep|nlp|vision|bot/.test(key)) return Cpu;
  if (/data|analy|bi|science|stat|excel/.test(key)) return BarChart3;
  if (/database|sql|postgres|mongo|dba/.test(key)) return Database;
  if (/cloud|devops|infra|aws|docker|k8s|system/.test(key)) return Cloud;
  if (/security|cyber|audit|pentest/.test(key)) return Shield;
  if (/web|frontend|backend|fullstack|software|dev|code|program|engineer/.test(key))
    return Code2;
  if (/market|seo|ads|growth|social|sales/.test(key)) return Megaphone;
  if (/writ|content|copy|blog|translat|edit/.test(key)) return PenTool;
  if (/video|audio|motion|3d|anim|photo|media/.test(key)) return Video;
  if (/network|global|consult|support|admin/.test(key)) return Globe;
  if (/product|project|manage|agile/.test(key)) return Layers;
  return Briefcase;
}

/** UC-46.06 — danh sách danh mục công việc đang hoạt động (chỉ đọc). */
export function CategoryListContent({
  initialCategories,
  popularCategories = [],
  initialPagination,
  initialSearch = "",
}: CategoryListContentProps) {
  const router = useRouter();
  const t = useTranslations("jobCategories");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(initialSearch);

  const basePath = "/freelancer/categories";
  const categories = initialCategories ?? [];
  const pagination = initialPagination;
  const showPopularSection =
    !initialSearch && pagination.page === 1 && popularCategories.length > 0;

  useEffect(() => {
    setSearchInput(initialSearch);
  }, [initialSearch]);

  const pushWithParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (initialSearch) params.set("search", initialSearch);
    if (pagination.page > 1) params.set("page", String(pagination.page));

    for (const [name, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(name);
      else params.set(name, value);
    }

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${basePath}?${query}` : basePath);
    });
  };

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    pushWithParams({ search: searchInput.trim() || null, page: null });
  };

  const goToPage = (page: number) => {
    pushWithParams({ page: page > 1 ? String(page) : null });
  };

  return (
    <div className="flex flex-1 flex-col bg-background font-sans pb-20">
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 sm:px-6 lg:px-8">
        {/* ── 01. Hero Section – Khám phá danh mục ── */}
        <section className="rounded-2xl border border-border bg-muted/30 px-5 py-8 sm:px-8 sm:py-10 text-center">
          <p className="inline-flex items-center rounded-full border border-border bg-background px-3.5 py-1 text-xs font-medium text-muted-foreground">
            {t("heroEyebrow")}
          </p>

          <h1 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            {t("heroTitle")}
          </h1>

          <p className="mx-auto mt-2.5 max-w-2xl text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {t("listSubtitle")}
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto mt-6 max-w-2xl"
          >
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5 focus-within:ring-1 focus-within:ring-[#0069D3]">
              <div className="relative flex flex-1 items-center">
                <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-9 w-full bg-transparent pl-9 pr-8 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      pushWithParams({ search: null, page: null });
                    }}
                    className="absolute right-2 flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                    title={t("clearSearch")}
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>

              <Button
                type="submit"
                size="sm"
                className="h-9 rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white px-4 text-xs sm:text-sm font-medium shrink-0 cursor-pointer"
              >
                <span>{t("searchButton")}</span>
                <ArrowRight className="ml-1.5 size-3.5" />
              </Button>
            </div>
          </form>
        </section>

        {/* ── 02. Popular Categories – Danh mục phổ biến (4–6 cards lớn hơn) ── */}
        {showPopularSection && (
          <section className="mt-10">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {t("popularTitle")}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  {t("popularSubtitle")}
                </p>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {t("listCount", { count: popularCategories.length })}
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popularCategories.map((jobCategory) => {
                const CategoryIcon = getCategoryIcon(
                  jobCategory.name,
                  jobCategory.slug,
                );
                return (
                  <Link
                    key={jobCategory.id}
                    href={`${basePath}/${jobCategory.slug}`}
                    className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0069D3]/50"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-foreground group-hover:bg-[#0069D3]/10 group-hover:text-[#0069D3] transition-colors">
                          <CategoryIcon className="size-5" />
                        </span>
                        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80">
                          {t("jobsCount", { count: jobCategory.jobCount })}
                        </span>
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-[#0069D3] transition-colors line-clamp-1">
                        {jobCategory.name}
                      </h3>

                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground line-clamp-3">
                        {jobCategory.description || t("noDescription")}
                      </p>
                    </div>

                    <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0069D3]">
                      <span>{t("viewCategory")}</span>
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── 03. All Categories – Tất cả danh mục (Grid 3 cột) ── */}
        <section className={showPopularSection ? "mt-12" : "mt-8"}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {t("listTitle")}
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                {t("sectionSubtitle")}
              </p>
            </div>

            <span className="text-xs font-medium text-muted-foreground">
              {t("listCount", { count: pagination.total })}
            </span>
          </div>

          <div className="mt-4">
            {isPending ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center font-sans">
                <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <SearchX className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {t("emptyTitle")}
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                  {t("emptyDescription")}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((jobCategory) => {
                  const CategoryIcon = getCategoryIcon(
                    jobCategory.name,
                    jobCategory.slug,
                  );
                  return (
                    <Link
                      key={jobCategory.id}
                      href={`${basePath}/${jobCategory.slug}`}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0069D3]/50"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-[#0069D3]/10 group-hover:text-[#0069D3] transition-colors">
                          <CategoryIcon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-[#0069D3] transition-colors truncate">
                            {jobCategory.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t("jobsCount", { count: jobCategory.jobCount })}
                          </p>
                        </div>
                      </div>

                      <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-[#0069D3] group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  );
                })}
              </div>
            )}

            {!isPending && pagination.totalPages > 1 ? (
              <div className="mt-8 flex items-center justify-between border-t border-border pt-4 font-sans">
                <p className="font-sans text-xs text-muted-foreground">
                  {tCommon("pageOf", {
                    page: pagination.page,
                    totalPages: pagination.totalPages,
                  })}
                </p>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg cursor-pointer"
                    disabled={pagination.page <= 1}
                    onClick={() => goToPage(pagination.page - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg cursor-pointer"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => goToPage(pagination.page + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
