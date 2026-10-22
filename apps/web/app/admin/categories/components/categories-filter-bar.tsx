"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { SearchBar } from "../../components/search-bar";

interface CategoriesFilterBarProps {
  initialSearch?: string;
}

export function CategoriesFilterBar({
  initialSearch = "",
}: CategoriesFilterBarProps) {
  const t = useTranslations("adminCategories");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const searchParams = useSearchParams();

  const deletedParam = searchParams.get("deleted");
  const currentStatus =
    deletedParam === "true"
      ? "deleted"
      : deletedParam === "false"
        ? "active"
        : "all";

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("deleted");
    } else if (value === "active") {
      params.set("deleted", "false");
    } else {
      params.set("deleted", "true");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchBar
        placeholder={t("filterSearchPlaceholder")}
        initialSearch={initialSearch}
      />

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {t("filterStatusLabel")}
        </span>
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("filterAllStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filterAll")}</SelectItem>
            <SelectItem value="active">{tCommon("active")}</SelectItem>
            <SelectItem value="deleted">{t("statusDeleted")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}