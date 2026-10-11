"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  MonitorSmartphone,
  Search,
  X,
} from "lucide-react";

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

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

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

  const SortableHead = ({
    column,
    children,
    className = "",
  }: {
    column: SortBy;
    children: ReactNode;
    className?: string;
  }) => (
    <TableHead className={className}>
      <button
        type="button"
        className="inline-flex items-center font-medium text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => toggleSort(column)}
      >
        {children}
        <SortIcon column={column} />
      </button>
    </TableHead>
  );

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
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
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
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Device</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-28 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="ml-auto h-8 w-20" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div
              className={
                isFetching ? "opacity-60 transition-opacity" : undefined
              }
            >
              {sessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                    <MonitorSmartphone className="size-7" />
                  </div>
                  <p className="text-lg font-medium text-foreground">
                    {searchParam
                      ? "No sessions match your search"
                      : "No sessions yet"}
                  </p>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                    {searchParam
                      ? "Try a different device name or clear your search."
                      : "Devices you sign in on will appear here."}
                  </p>
                  {searchParam ? (
                    <Button
                      className="mt-6 bg-[#4fae2e] text-white hover:bg-[#459928]"
                      onClick={() => updateParams({ search: null, page: "1" })}
                    >
                      Clear search
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#eaf8df]/40 hover:bg-[#eaf8df]/40 dark:bg-muted/40 dark:hover:bg-muted/40">
                        <SortableHead column="id">Device</SortableHead>
                        <TableHead>IP address</TableHead>
                        <TableHead>Status</TableHead>
                        <SortableHead column="createdAt">Created</SortableHead>
                        <SortableHead column="expiresAt">Expires</SortableHead>
                        <TableHead className="w-28 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => {
                        const expired = isExpired(session.expiresAt);
                        return (
                          <TableRow
                            key={session.id}
                            className="hover:bg-[#eaf8df]/35 dark:hover:bg-white/4"
                          >
                            <TableCell className="min-w-48">
                              <div className="flex flex-col gap-1.5">
                                <span className="font-medium text-foreground">
                                  {session.deviceInfo || "Unknown device"}
                                </span>
                                {session.isCurrent ? (
                                  <Badge className="w-fit border-transparent bg-[#4fae2e] text-white hover:bg-[#4fae2e]">
                                    Current
                                  </Badge>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                              {session.ipAddress || "—"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  expired ? "destructive" : "secondary"
                                }
                                className={
                                  expired
                                    ? ""
                                    : "bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15"
                                }
                              >
                                {expired ? "Expired" : "Active"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(session.createdAt)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {formatDate(session.expiresAt)}
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
                      })}
                    </TableBody>
                  </Table>
                </div>
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
