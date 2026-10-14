"use client";

import { useState } from "react";
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
import { Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { AdminPagination } from "../../components/admin-pagination";
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

export function SkillsTable({ skills, pagination }: SkillsTableProps) {
  const [deletingSkill, setDeletingSkill] = useState<SkillAdminItemType | null>(
    null,
  );
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Jobs using it</TableHead>
              <TableHead className="text-right">Created</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skills.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  No skills found.
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
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Deleted
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {skill.jobCount ?? 0}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(skill.createdAt).toLocaleDateString()}
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
                            title="Delete skill"
                            aria-label={`Delete skill ${skill.name}`}
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
                        title="View details"
                      >
                        <Link
                          href={`/admin/skills/${skill.id}`}
                          aria-label={`View details of ${skill.name}`}
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
        <AdminPagination
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
