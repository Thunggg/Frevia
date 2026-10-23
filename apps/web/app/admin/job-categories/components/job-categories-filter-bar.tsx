"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";

// Sắp xếp do API hỗ trợ: sortBy ∈ id|createdAt|name, sortOrder ∈ asc|desc.
// Một Select gói cả 2 tham số để người dùng chọn trong 1 lần.
const SORT_OPTIONS = [
  { value: "id:desc", labelKey: "sortIdDesc" },
  { value: "id:asc", labelKey: "sortIdAsc" },
  { value: "createdAt:desc", labelKey: "sortCreatedAtDesc" },
  { value: "createdAt:asc", labelKey: "sortCreatedAtAsc" },
  { value: "name:asc", labelKey: "sortNameAsc" },
  { value: "name:desc", labelKey: "sortNameDesc" },
] as const;

const SORT_VALUES: readonly string[] = SORT_OPTIONS.map((item) => item.value);

// Thanh lọc danh sách danh mục công việc:
// tìm kiếm (name/slug/description) + lọc trạng thái nghiệp vụ + lọc đã xoá + sắp xếp
export function JobCategoriesFilterBar() {
  const t = useTranslations("adminJobCategories");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const currentStatus = searchParams.get("status") || "all";
  const currentDeleted = searchParams.get("deleted") ?? "all";
  const sortBy = searchParams.get("sortBy") || "id";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const sortValue = `${sortBy}:${sortOrder}`;
  const currentSort = SORT_VALUES.includes(sortValue) ? sortValue : "id:desc";

  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  const updateQueryParams = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    params.delete("page"); // Về trang 1 khi đổi bộ lọc
    router.push(`?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueryParams({ search: search.trim() || undefined });
  };

  const handleClearSearch = () => {
    setSearch("");
    updateQueryParams({ search: undefined });
  };

  const handleSortChange = (value: string) => {
    const [nextSortBy, nextSortOrder] = value.split(":");
    updateQueryParams({ sortBy: nextSortBy, sortOrder: nextSortOrder });
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <form
        onSubmit={handleSearchSubmit}
        className="relative flex flex-1 items-center max-w-sm"
      >
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("filterSearchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-8"
        />
        {search && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-2.5 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {t("filterStatusLabel")}
          </span>
          <Select
            value={currentStatus}
            onValueChange={(value) => updateQueryParams({ status: value })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder={t("filterAllStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filterAll")}</SelectItem>
              <SelectItem value="ACTIVE">{t("statusActive")}</SelectItem>
              <SelectItem value="INACTIVE">{t("statusInactive")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {t("filterDeletedLabel")}
          </span>
          <Select
            value={currentDeleted}
            onValueChange={(value) => updateQueryParams({ deleted: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("filterDeletedAll")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tCommon("all")}</SelectItem>
              <SelectItem value="false">{t("filterNotDeleted")}</SelectItem>
              <SelectItem value="true">{t("statusDeleted")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {t("filterSortLabel")}
          </span>
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder={t("filterSortPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
