"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import type { JobCategoryAdminItemType } from "@shared/types";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/format";
import { NumberedPagination } from "../../components/numbered-pagination";
import { DeleteJobCategoryDialog } from "./delete-job-category-dialog";
import { RestoreJobCategoryDialog } from "./restore-job-category-dialog";
import { UpdateJobCategoryDialog } from "./update-job-category-dialog";

interface JobCategoriesTableProps {
  jobCategories: JobCategoryAdminItemType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type SortBy = "id" | "createdAt" | "name";

const SORT_COLUMNS: SortBy[] = ["id", "createdAt", "name"];

function resolveSortBy(value: string | null): SortBy {
  return SORT_COLUMNS.find((column) => column === value) ?? "id";
}

export function JobCategoriesTable({
  jobCategories,
  pagination,
}: JobCategoriesTableProps) {
  const t = useTranslations("adminJobCategories");
  const tCommon = useTranslations("adminCommon");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deletingCategory, setDeletingCategory] =
    useState<JobCategoryAdminItemType | null>(null);

  const sortBy = resolveSortBy(searchParams.get("sortBy"));
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  const toggleSort = (column: SortBy) => {
    const nextOrder = sortBy === column && sortOrder === "desc" ? "asc" : "desc";
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", column);
    params.set("sortOrder", nextOrder);
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const SortIcon = ({ column }: { column: SortBy }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-foreground" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-foreground" />
    );
  };

  return (
    <div className="space-y-4">
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
                  {tCommon("id")}
                  <SortIcon column="id" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  {tCommon("name")}
                  <SortIcon column="name" />
                </button>
              </TableHead>
              <TableHead>{t("colSlug")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead className="text-right">{t("colJobCount")}</TableHead>
              <TableHead className="text-right">
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
            {jobCategories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  {t("noJobCategories")}
                </TableCell>
              </TableRow>
            ) : (
              jobCategories.map((category) => (
                <TableRow key={category.id} className="group">
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {category.id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">
                        {category.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {category.status === "ACTIVE" ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 border"
                        >
                          {t("statusActive")}
                        </Badge>
                      ) : (
                        <Badge variant="outline">{t("statusInactive")}</Badge>
                      )}
                      {category.deletedAt !== null && (
                        <Badge variant="destructive">
                          {t("statusDeleted")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {category.jobCount ?? 0}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(category.createdAt, locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {category.deletedAt === null ? (
                        <>
                          <UpdateJobCategoryDialog
                            jobCategory={category}
                            triggerClassName="h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title={t("deleteTrigger")}
                            aria-label={t("deleteTriggerOf", {
                              name: category.name,
                            })}
                            onClick={() => setDeletingCategory(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <RestoreJobCategoryDialog jobCategory={category} />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
                        title={t("viewDetailsAction")}
                      >
                        <Link
                          href={`/admin/job-categories/${category.id}`}
                          aria-label={t("viewDetailsOf", {
                            name: category.name,
                          })}
                        >
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

      {pagination.totalPages > 1 && (
        <NumberedPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
        />
      )}

      <DeleteJobCategoryDialog
        jobCategory={deletingCategory}
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      />
    </div>
  );
}
