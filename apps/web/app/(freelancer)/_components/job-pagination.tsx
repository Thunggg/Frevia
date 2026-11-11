"use client";

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
  if (totalResults === 0) return null;

  const from = Math.min((currentPage - 1) * pageSize + 1, totalResults);
  const to = Math.min(currentPage * pageSize, totalResults);
  const paginationItems = getPaginationItems(currentPage, totalPages);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-border/80 pt-5 font-sans text-xs">
      {/* 1. Result Count */}
      <div className="flex items-center text-muted-foreground">
        <span>
          Hiển thị <span className="font-semibold text-foreground">{from}</span>{" "}
          – <span className="font-semibold text-foreground">{to}</span> trong số{" "}
          <span className="font-semibold text-foreground">{totalResults}</span>{" "}
          công việc
        </span>
      </div>

      {/* 2. Controls: Page size + Page buttons */}
      <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
        {/* Page size selector: 10, 20, 50 */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Số lượng:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-medium w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-card p-1 shadow-lg">
                <SelectItem value="10" className="rounded-md text-xs cursor-pointer">
                  10
                </SelectItem>
                <SelectItem value="20" className="rounded-md text-xs cursor-pointer">
                  20
                </SelectItem>
                <SelectItem value="50" className="rounded-md text-xs cursor-pointer">
                  50
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page numbers & Prev / Next */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* Previous button: Disabled ở trang đầu */}
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => onPageChange(currentPage - 1)}
              className="h-8 rounded-lg px-2.5 text-xs font-medium gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-3.5" />
              <span className="hidden sm:inline">Trước</span>
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
                    className={`size-8 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      isCurrent
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs pointer-events-none"
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
              className="h-8 rounded-lg px-2.5 text-xs font-medium gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Sau</span>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

