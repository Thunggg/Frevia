"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Search, X } from "@/components/icons";

import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";

const SEARCH_DEBOUNCE_MS = 400;

type ForumCategorySearchProps = {
  initialSearch: string;
};

export function ForumCategorySearch({
  initialSearch,
}: ForumCategorySearchProps) {
  const t = useTranslations("forum");
  const router = useRouter();
  const [value, setValue] = useState(initialSearch);
  const isFirstRender = useRef(true);

  // Đồng bộ lại input khi URL thay đổi (clear, back/forward, đổi trang...)
  useEffect(() => {
    setValue(initialSearch);
  }, [initialSearch]);

  // Tự động search sau khi người dùng ngừng gõ
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const trimmed = value.trim();
    if (trimmed === initialSearch) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (trimmed) params.set("search", trimmed);
      const qs = params.toString();
      router.replace(qs ? `/forum?${qs}` : "/forum", { scroll: false });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, initialSearch, router]);

  const clearSearch = () => {
    setValue("");
    router.replace("/forum", { scroll: false });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("search", trimmed);
    const qs = params.toString();
    router.replace(qs ? `/forum?${qs}` : "/forum", { scroll: false });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center"
      role="search"
    >
      <div className="relative w-full max-w-md">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50"
          strokeWidth={1.75}
        />
        <Input
          type="text"
          name="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("searchCategoriesPlaceholder")}
          autoComplete="off"
          enterKeyHint="search"
          className="h-11 rounded-lg border-border bg-transparent pl-9 pr-9 text-sm focus:border-[#4fae2e]/50 focus:ring-1 focus:ring-[#4fae2e]/20"
        />
        {value ? (
          <button
            type="button"
            onClick={clearSearch}
            aria-label={t("clearSearch")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-[#4fae2e] transition-colors hover:text-[#3f9225] dark:text-[#5bc03a] dark:hover:text-[#6ecf4c]"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      <Button
        type="submit"
        className="h-11 gap-1.5 bg-[#4fae2e] text-white hover:bg-[#459928]"
      >
        <Search className="size-4" />
        {t("search")}
      </Button>
    </form>
  );
}
