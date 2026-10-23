"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";

export function UsersFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("adminUsers");
  const tRole = useTranslations("roleName");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const currentRole = searchParams.get("role") || "all";

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
    params.delete("page"); // Reset to page 1 when filter changes
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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form
        onSubmit={handleSearchSubmit}
        className="relative flex flex-1 items-center max-w-sm"
      >
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t("searchPlaceholder")}
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

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {t("filterRole")}
        </span>
        <Select
          value={currentRole}
          onValueChange={(value) => updateQueryParams({ role: value })}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t("allRoles")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allRoles")}</SelectItem>
            <SelectItem value="ADMIN">{tRole("ADMIN")}</SelectItem>
            <SelectItem value="CLIENT">{tRole("CLIENT")}</SelectItem>
            <SelectItem value="FREELANCER">{tRole("FREELANCER")}</SelectItem>
            <SelectItem value="EXPERT">{tRole("EXPERT")}</SelectItem>
            <SelectItem value="CUSTOM">{t("customRolesFilter")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
