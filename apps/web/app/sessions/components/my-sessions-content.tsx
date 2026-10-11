"use client";

import { Footer } from "@/components/footer";
import type { HeaderProps } from "@/components/header";
import { Header } from "@/components/header";
import { useSessions } from "@/hooks/use-session";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/shadcn/pagination";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RevokeSessionDialog } from "./revoke-session-dialog";
import {
  SessionDetailDialog,
  ViewSessionButton,
} from "./session-detail-dialog";

const PAGE_SIZE = 10;

type SortBy = "id" | "createdAt" | "expiresAt";
type SortOrder = "asc" | "desc";

function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "...")[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (currentPage > 3) {
    pages.push("...");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("...");
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isExpired(expiresAt: Date | string) {
  return new Date(expiresAt).getTime() < Date.now();
}

type MySessionsContentProps = {
  role: HeaderProps["role"];
};

export function MySessionsContent({ role }: MySessionsContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const searchParam = searchParams.get("search") ?? "";
  const sortByParam = searchParams.get("sortBy");
  const orderParam = searchParams.get("order");

  const sortBy: SortBy =
    sortByParam === "id" ||
    sortByParam === "createdAt" ||
    sortByParam === "expiresAt"
      ? sortByParam
      : "createdAt";
  const order: SortOrder = orderParam === "asc" ? "asc" : "desc";

  const [searchInput, setSearchInput] = useState(searchParam);
  const [detailSessionId, setDetailSessionId] = useState<number | null>(null);
  const detailOpen = detailSessionId !== null;

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // cập nhật params trong url mà không reload trang
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      // tạo mới một URLSearchParams mới từ searchParams hiện tại
      // và cập nhật các params mới
      const params = new URLSearchParams(searchParams.toString());

      // vòng lặp qua các params mới và cập nhật chúng
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      // chuyển hướng đến URL mới
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const { data, isLoading, isFetching, isError } = useSessions({
    page,
    limit: PAGE_SIZE,
    search: searchParam || undefined,
    sortBy,
    order,
  });

  const sessions = data?.sessions ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  };

  const toggleSort = (column: SortBy) => {
    if (sortBy === column) {
      updateParams({
        sortBy: column,
        order: order === "asc" ? "desc" : "asc",
        page: "1",
      });
    } else {
      updateParams({ sortBy: column, order: "desc", page: "1" });
    }
  };

  const SortIcon = ({ column }: { column: SortBy }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-1 inline size-3.5 opacity-40" />;
    }
    return order === "asc" ? (
      <ArrowUp className="ml-1 inline size-3.5" />
    ) : (
      <ArrowDown className="ml-1 inline size-3.5" />
    );
  };

  const applySearch = () => {
    updateParams({
      search: searchInput.trim() || null,
      page: "1",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header role={role} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Sessions</h1>
          <p className="text-muted-foreground">
            Devices and browsers currently signed in to your account
          </p>
        </div>

        <form
          className="mb-4 flex max-w-sm gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search device or IP..."
              className="pl-9"
            />
          </div>
          {searchParam && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchInput("");
                updateParams({ search: null, page: "1" });
              }}
              aria-label="Clear search"
            >
              <X className="size-4" />
            </Button>
          )}
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {isError ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Failed to load sessions. Please try again.
          </p>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div
            className={isFetching ? "opacity-60 transition-opacity" : undefined}
          >
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center font-medium"
                        onClick={() => toggleSort("id")}
                      >
                        ID
                        <SortIcon column="id" />
                      </button>
                    </TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center font-medium"
                        onClick={() => toggleSort("createdAt")}
                      >
                        Created
                        <SortIcon column="createdAt" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        className="inline-flex items-center font-medium"
                        onClick={() => toggleSort("expiresAt")}
                      >
                        Expires
                        <SortIcon column="expiresAt" />
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No sessions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((session) => {
                      const expired = isExpired(session.expiresAt);
                      return (
                        <TableRow key={session.id}>
                          <TableCell className="font-mono text-sm">
                            {session.id}
                          </TableCell>
                          <TableCell className="max-w-[240px] truncate">
                            {session.deviceInfo || "—"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {session.ipAddress || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(session.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(session.expiresAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2">
                              {session.isCurrent && (
                                <Badge variant="default">Current</Badge>
                              )}
                              <Badge
                                variant={expired ? "destructive" : "secondary"}
                              >
                                {expired ? "Expired" : "Active"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              <ViewSessionButton
                                sessionId={session.id}
                                onView={setDetailSessionId}
                              />
                              <RevokeSessionDialog
                                sessionId={session.id}
                                deviceInfo={session.deviceInfo}
                                isCurrent={session.isCurrent}
                                isExpired={expired}
                                onRevoked={() => {
                                  if (detailSessionId === session.id) {
                                    setDetailSessionId(null);
                                  }
                                }}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <SessionDetailDialog
              sessionId={detailSessionId}
              open={detailOpen}
              onOpenChange={(open) => {
                if (!open) setDetailSessionId(null);
              }}
            />

            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} (
                  {pagination.total} total)
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (page > 1) {
                            updateParams({ page: String(page - 1) });
                          }
                        }}
                        aria-disabled={page <= 1}
                        className={
                          page <= 1
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                      />
                    </PaginationItem>
                    {getPageNumbers(page, pagination.totalPages).map(
                      (item, index) =>
                        item === "..." ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={item}>
                            <PaginationLink
                              href="#"
                              isActive={item === page}
                              onClick={(event) => {
                                event.preventDefault();
                                updateParams({ page: String(item) });
                              }}
                            >
                              {item}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (page < pagination.totalPages) {
                            updateParams({ page: String(page + 1) });
                          }
                        }}
                        aria-disabled={page >= pagination.totalPages}
                        className={
                          page >= pagination.totalPages
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
