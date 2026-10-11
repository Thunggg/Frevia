"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";

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
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-[#4fae2e]/25 dark:bg-[#12331f]">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">Sessions</span>
            </nav>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              My Sessions
            </h1>
            <p className="mt-2 max-w-[42ch] text-base text-foreground/70 dark:text-foreground/75">
              Devices and browsers currently signed in to your account.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <form
          className="mb-6 flex max-w-md gap-2"
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
              className="h-11 pl-9"
            />
          </div>
          {searchParam ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11"
              onClick={() => {
                setSearchInput("");
                updateParams({ search: null, page: "1" });
              }}
              aria-label="Clear search"
            >
              <X className="size-4" />
            </Button>
          ) : null}
          <Button
            type="submit"
            className="h-11 bg-[#4fae2e] text-white hover:bg-[#459928]"
          >
            Search
          </Button>
        </form>

        {isError ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Failed to load sessions. Please try again.
          </p>
        ) : isLoading ? (
          <div className="divide-y divide-border border-y border-border">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="px-3 py-5 sm:px-5">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="mt-3 h-4 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div
            className={isFetching ? "opacity-60 transition-opacity" : undefined}
          >
            {sessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                <p className="text-lg font-medium text-foreground">
                  No sessions found
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  {searchParam
                    ? "Try a different search."
                    : "Signed-in devices will show up here."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {sessions.map((session) => {
                  const expired = isExpired(session.expiresAt);
                  return (
                    <li key={session.id}>
                      <div className="flex flex-col gap-4 px-3 py-5 transition-colors hover:bg-[#eaf8df]/35 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-6 dark:hover:bg-[#12331f]/35">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold tracking-tight text-foreground">
                              {session.deviceInfo || "Unknown device"}
                            </p>
                            {session.isCurrent ? (
                              <Badge className="border-transparent bg-[#4fae2e] text-white hover:bg-[#4fae2e]">
                                Current
                              </Badge>
                            ) : null}
                            <Badge
                              variant={expired ? "destructive" : "secondary"}
                              className={
                                expired
                                  ? ""
                                  : "bg-[#eaf8df] text-[#4fae2e] dark:bg-[#12331f]"
                              }
                            >
                              {expired ? "Expired" : "Active"}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="font-mono text-xs">
                              IP: {session.ipAddress || "—"}
                            </span>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 hover:text-foreground"
                              onClick={() => toggleSort("createdAt")}
                            >
                              Created {formatDate(session.createdAt)}
                              <SortIcon column="createdAt" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 hover:text-foreground"
                              onClick={() => toggleSort("expiresAt")}
                            >
                              Expires {formatDate(session.expiresAt)}
                              <SortIcon column="expiresAt" />
                            </button>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
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
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <SessionDetailDialog
              sessionId={detailSessionId}
              open={detailOpen}
              onOpenChange={(open) => {
                if (!open) setDetailSessionId(null);
              }}
            />

            {pagination.totalPages > 1 ? (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
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
            ) : null}
          </div>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
