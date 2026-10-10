"use client";

import { usePermissions } from "@/hooks/use-permission";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { HttpMethod, type HttpMethodType } from "@shared/types";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 10;

type SortBy = "id" | "createdAt";
type SortOrder = "asc" | "desc";

const METHOD_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  [HttpMethod.GET]: "secondary",
  [HttpMethod.POST]: "default",
  [HttpMethod.PUT]: "outline",
  [HttpMethod.PATCH]: "outline",
  [HttpMethod.DELETE]: "destructive",
};

const HTTP_METHODS = Object.values(HttpMethod);

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

export function PermissionsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const methodParam = searchParams.get("method") ?? "";
  const moduleParam = searchParams.get("module") ?? "";
  const searchParam = searchParams.get("search") ?? "";
  const sortByParam = searchParams.get("sortBy");
  const orderParam = searchParams.get("order");

  const sortBy: SortBy =
    sortByParam === "createdAt" || sortByParam === "id" ? sortByParam : "id";
  const order: SortOrder =
    orderParam === "desc" || orderParam === "asc" ? orderParam : "asc";

  const method = HTTP_METHODS.includes(methodParam as HttpMethodType)
    ? (methodParam as HttpMethodType)
    : undefined;

  const [searchInput, setSearchInput] = useState(searchParam);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  const { data, isLoading, isError } = usePermissions({
    page,
    limit: PAGE_SIZE,
    search: searchParam || undefined,
    method,
    module: moduleParam || undefined,
    sortBy,
    order,
  });

  const permissions = data?.permissions ?? [];
  const pagination = data?.pagination;
  const modules = data?.modules ?? [];
  const totalPages = pagination?.totalPages ?? 0;
  const total = pagination?.total ?? 0;

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }

      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const goToPage = (nextPage: number) => {
    updateParams({
      page: nextPage > 1 ? String(nextPage) : undefined,
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({
      search: searchInput.trim() || undefined,
      page: undefined,
    });
  };

  const clearSearch = () => {
    setSearchInput("");
    updateParams({ search: undefined, page: undefined });
  };

  const toggleSort = (column: SortBy) => {
    const nextOrder: SortOrder =
      sortBy === column && order === "asc" ? "desc" : "asc";

    updateParams({
      sortBy: column === "id" ? undefined : column,
      order:
        column === "id" && nextOrder === "asc" ? undefined : nextOrder,
      page: undefined,
    });
  };

  const SortIcon = ({ column }: { column: SortBy }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    return order === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Permission Management
        </h1>
        <p className="text-muted-foreground mt-1">
          View all API permissions in the system
          {!isLoading && !isError ? ` (${total} total)` : ""}
        </p>
      </div>

      {!isLoading && !isError && (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-sm"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, path, module..."
              className="pl-9 pr-9"
            />
            {searchInput && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>

          <Select
            value={methodParam || "all"}
            onValueChange={(value) =>
              updateParams({
                method: value === "all" ? undefined : value,
                page: undefined,
              })
            }
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              {HTTP_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={moduleParam || "all"}
            onValueChange={(value) =>
              updateParams({
                module: value === "all" ? undefined : value,
                page: undefined,
              })
            }
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modules</SelectItem>
              {modules.map((mod) => (
                <SelectItem key={mod} value={mod}>
                  {mod}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Loading permissions...
        </p>
      ) : isError ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          Failed to load permissions. Please try again.
        </p>
      ) : (
        <>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16">
                    <button
                      type="button"
                      onClick={() => toggleSort("id")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      ID
                      <SortIcon column="id" />
                    </button>
                  </TableHead>
                  <TableHead className="w-24">Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("createdAt")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      Created
                      <SortIcon column="createdAt" />
                    </button>
                  </TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      {searchParam || methodParam || moduleParam
                        ? "No permissions match your filters."
                        : "No permissions found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  permissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {permission.id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            METHOD_VARIANT[permission.method] ?? "outline"
                          }
                        >
                          {permission.method}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-md truncate">
                        {permission.path}
                      </TableCell>
                      <TableCell>
                        {permission.module ? (
                          <Badge variant="outline">{permission.module}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(permission.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <Link href={`/admin/permissions/${permission.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} total)
              </p>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) goToPage(page - 1);
                      }}
                      aria-disabled={page <= 1}
                      className={
                        page <= 1 ? "pointer-events-none opacity-50" : undefined
                      }
                    />
                  </PaginationItem>

                  {getPageNumbers(page, totalPages).map((pageNum, index) =>
                    pageNum === "..." ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          isActive={pageNum === page}
                          onClick={(e) => {
                            e.preventDefault();
                            goToPage(pageNum);
                          }}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) goToPage(page + 1);
                      }}
                      aria-disabled={page >= totalPages}
                      className={
                        page >= totalPages
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}
    </div>
  );
}
