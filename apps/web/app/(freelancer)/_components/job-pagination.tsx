"use client";

import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";

export type JobPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  isLoading?: boolean;
};

/**
 * Tạo danh sách các số trang kèm dấu ... (Ellipsis)
 */
function getPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Nếu ở gần đầu (1, 2, 3, 4)
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages];
  }

  // Nếu ở gần cuối
  if (currentPage >= totalPages - 3) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // Nếu ở giữa
  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

export function JobPagination({
  currentPage,
  totalPages,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}: JobPaginationProps) {
  const t = useTranslations("findWork");

  if (totalResults === 0 || totalPages <= 1) return null;

  const from = Math.min((currentPage - 1) * pageSize + 1, totalResults);
  const to = Math.min(currentPage * pageSize, totalResults);
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border pt-6 font-sans text-xs">
      {/* 1. Result Count */}
      <div className="flex items-center text-muted-foreground">
        <span>{t("paginationShowing", { from, to, total: totalResults })}</span>
      </div>

      {/* 2. Controls: Page size + Page buttons */}
      <div className="flex flex-wrap items-center gap-3 self-center sm:self-auto">
        {/* Page size selector: 10, 20 */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{t("paginationPerPage")}</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 rounded-full border border-border bg-card px-3 text-xs font-medium w-[76px] cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-card p-1 shadow-lg">
                <SelectItem value="10" className="rounded-md text-xs cursor-pointer">
                  10
                </SelectItem>
                <SelectItem value="20" className="rounded-md text-xs cursor-pointer">
                  20
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page numbers & Prev / Next */}
        <div className="flex items-center gap-1">
          {/* Previous button: Disabled ở trang đầu */}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-8 rounded-full px-3 text-xs font-medium gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-3.5" />
            <span className="hidden sm:inline">{t("paginationPrevious")}</span>
          </Button>

          {/* Numeric page items & Ellipsis */}
          <div className="flex items-center gap-1">
            {paginationItems.map((item, index) => {
              if (item === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="flex size-8 items-center justify-center text-muted-foreground select-none"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = item === currentPage;
              return (
                <Button
                  key={`page-${item}`}
                  variant={isCurrent ? "default" : "outline"}
                  size="icon"
                  disabled={isLoading}
                  onClick={() => onPageChange(item)}
                  className={`size-8 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                    isCurrent
                      ? "bg-[#0069D3] hover:bg-[#005bb8] text-white shadow-xs pointer-events-none"
                      : "border border-border text-foreground hover:bg-muted font-normal"
                  }`}
                >
                  {item}
                </Button>
              );
            })}
          </div>

          {/* Next button: Disabled ở trang cuối */}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 rounded-full px-3 text-xs font-medium gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">{t("paginationNext")}</span>
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

