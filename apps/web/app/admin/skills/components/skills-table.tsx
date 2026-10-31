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
import type { SkillAdminItemType } from "@shared/types";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/format";
import { NumberedPagination } from "../../components/numbered-pagination";
import { UpdateSkillDialog } from "./update-skill-dialog";
import { DeleteSkillDialog } from "./delete-skill-dialog";
import { RestoreSkillDialog } from "./restore-skill-dialog";

interface SkillsTableProps {
  skills: SkillAdminItemType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type SortBy = "id" | "createdAt";

export function SkillsTable({ skills, pagination }: SkillsTableProps) {
  const t = useTranslations("adminSkills");
  const tCommon = useTranslations("adminCommon");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deletingSkill, setDeletingSkill] = useState<SkillAdminItemType | null>(
    null,
  );

  const sortByParam = searchParams.get("sortBy");
  const sortOrderParam = searchParams.get("sortOrder");
  const sortBy: SortBy = sortByParam === "createdAt" ? "createdAt" : "id";
  const sortOrder = sortOrderParam === "asc" ? "asc" : "desc";

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
              <TableHead>{tCommon("name")}</TableHead>
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
            {skills.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  {t("noSkills")}
                </TableCell>
              </TableRow>
            ) : (
              skills.map((skill) => (
                <TableRow key={skill.id} className="group">
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {skill.id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">
                        {skill.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {skill.slug}
                  </TableCell>
                  <TableCell>
                    {skill.deletedAt === null ? (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 border"
                      >
                        {tCommon("active")}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">{t("statusDeleted")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {skill.jobCount ?? 0}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(skill.createdAt, locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {skill.deletedAt === null ? (
                        <>
                          <UpdateSkillDialog
                            skill={skill}
                            triggerClassName="h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title={t("deleteSkillAction")}
                            aria-label={t("deleteSkillOf", { name: skill.name })}
                            onClick={() => setDeletingSkill(skill)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <RestoreSkillDialog skill={skill} />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
                        title={t("viewDetailsAction")}
                      >
                        <Link
                          href={`/admin/skills/${skill.id}`}
                          aria-label={t("viewDetailsOf", { name: skill.name })}
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

      <DeleteSkillDialog
        skill={deletingSkill}
        open={!!deletingSkill}
        onOpenChange={(open) => !open && setDeletingSkill(null)}
      />
    </div>
  );
}