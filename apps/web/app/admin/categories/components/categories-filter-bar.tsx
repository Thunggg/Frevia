"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
        placeholder="Search categories by name..."
        initialSearch={initialSearch}
      />

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          Status:
        </span>
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}