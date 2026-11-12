"use client";

import { usePermissions } from "@/hooks/use-permission";
import {
  getPermissionScope,
  SCOPE_DEFINITIONS,
} from "@/lib/permission-scopes";
import { getPermissionDisplayName } from "@/lib/permission-utils";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
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
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  HttpMethodBadge,
  getMethodDotColor,
} from "../../components/http-method-badge";
import { NumberedPagination } from "../../components/numbered-pagination";
import { AdminTableSkeleton } from "../../components/table-skeleton";

const PAGE_SIZE = 10;

type SortBy = "id" | "createdAt";
type SortOrder = "asc" | "desc";

const HTTP_METHODS = Object.values(HttpMethod);

export function PermissionsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("adminPermissions");
  const tCommon = useTranslations("adminCommon");
  const format = useFormatter();
  const locale = useLocale();

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

  const { data, isLoading, isFetching, isError } = usePermissions({
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
      order: column === "id" && nextOrder === "asc" ? undefined : nextOrder,
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
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("subtitle")}
          {!isLoading && !isError
            ? ` ${tCommon("total", { count: total })}`
            : ""}
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
              placeholder={t("searchPlaceholder")}
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
              <SelectValue placeholder={t("allMethods")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allMethods")}</SelectItem>
              {HTTP_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${getMethodDotColor(m)}`}
                    />
                    <span>{m}</span>
                  </div>
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
              <SelectValue placeholder={t("allModules")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allModules")}</SelectItem>
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
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Skeleton className="h-9 w-full max-w-sm" />
            <Skeleton className="h-9 w-[140px]" />
            <Skeleton className="h-9 w-[180px]" />
          </div>
          <AdminTableSkeleton
            columns={["w-16", "w-44", "w-24", "", "w-28", "w-28", "w-20"]}
            rows={10}
          />
        </div>
      ) : isError && !data ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {t("loadFailed")}
        </p>
      ) : (
        <>
          <div
            className={`rounded-lg border bg-card transition-opacity ${
              isFetching ? "opacity-60" : "opacity-100"
            }`}
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16">
                    <button
                      type="button"
                      onClick={() => toggleSort("id")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {tCommon("id")}
                      <SortIcon column="id" />
                    </button>
                  </TableHead>
                  <TableHead className="min-w-[180px]">
                    {t("permissionName")}
                  </TableHead>
                  <TableHead className="w-24">{tCommon("method")}</TableHead>
                  <TableHead>{tCommon("path")}</TableHead>
                  <TableHead>{tCommon("module")}</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={() => toggleSort("createdAt")}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {tCommon("created")}
                      <SortIcon column="createdAt" />
                    </button>
                  </TableHead>
                  <TableHead className="w-20 text-right">
                    {tCommon("actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-12 text-muted-foreground"
                    >
                      {searchParam || methodParam || moduleParam
                        ? t("noMatch")
                        : t("noPermissions")}
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
                      <TableCell className="font-medium text-sm text-foreground">
                        {getPermissionDisplayName(permission, locale)}
                      </TableCell>
                      <TableCell>
                        <HttpMethodBadge method={permission.method} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-xs truncate">
                        {permission.path}
                      </TableCell>
                      <TableCell>
                        {permission.module ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs">
                              {permission.module}
                            </Badge>
                            {(() => {
                              const scope = getPermissionScope(permission);
                              const scopeDef = SCOPE_DEFINITIONS[scope];
                              return (
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] px-1.5 py-0 h-4 border ${scopeDef.badgeClass}`}
                                >
                                  {locale === "vi"
                                    ? scopeDef.labelVi
                                    : scopeDef.labelEn}
                                </Badge>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {format.dateTime(new Date(permission.createdAt), {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
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
            <NumberedPagination
              page={page}
              totalPages={totalPages}
              total={total}
            />
          )}
        </>
      )}
    </div>
  );
}
