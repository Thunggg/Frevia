"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Input } from "@repo/ui/components/shadcn/input";
import { Button } from "@repo/ui/components/shadcn/button";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  searchKey?: string;
  initialSearch?: string;
}

export function SearchBar({
  placeholder = "Search...",
  searchKey = "search",
  initialSearch = "",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set(searchKey, value.trim());
        params.delete("page");
      } else {
        params.delete(searchKey);
        params.delete("page");
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams, value, searchKey],
  );

  const handleClear = useCallback(() => {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete(searchKey);
    params.delete("page");
    router.push(`?${params.toString()}`);
  }, [router, searchParams, searchKey]);

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <Button type="submit" variant="secondary" size="sm">
        Search
      </Button>
    </form>
  );
}
