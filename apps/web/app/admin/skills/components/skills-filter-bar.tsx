"use client";

import { useEffect, useState } from "react";
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

// Thanh lọc danh sách skill: tìm kiếm (name/slug/description) + lọc Active/Deleted
export function SkillsFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const currentStatus = searchParams.get("deleted") || "all";

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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form
        onSubmit={handleSearchSubmit}
        className="relative flex flex-1 items-center max-w-sm"
      >
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name, slug or description..."
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
          Filter Status:
        </span>
        <Select
          value={currentStatus}
          onValueChange={(value) => updateQueryParams({ deleted: value })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="false">Active</SelectItem>
            <SelectItem value="true">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
