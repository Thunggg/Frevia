"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { Eye, ExternalLink, FileText, Calendar, Hash } from "lucide-react";
import { AdminPagination } from "../../components/admin-pagination";
import type { ForumCategoryType } from "@shared/types";

interface CategoriesTableProps {
  categories: ForumCategoryType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function CategoriesTable({
  categories,
  pagination,
}: CategoriesTableProps) {
  const [viewingCategory, setViewingCategory] =
    useState<ForumCategoryType | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="group">
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {category.id}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {category.name}
                    {category.description && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {category.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="border border-[#4fae2e]/20 bg-[#eaf8df] text-xs text-[#4fae2e] dark:bg-[#4fae2e]/15"
                    >
                      <FileText className="mr-1 h-3 w-3" />
                      {category.postCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(category.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewingCategory(category)}
                      >
                        <Eye className="h-4 w-4" />
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

      {/* View Detail Dialog */}
      <Dialog
        open={!!viewingCategory}
        onOpenChange={(open) => !open && setViewingCategory(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="pr-8 text-xl">
              {viewingCategory?.name}
            </DialogTitle>
          </DialogHeader>
          {viewingCategory && (
            <div className="space-y-4">
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  <span>ID: {viewingCategory.id}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {new Date(viewingCategory.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="border border-[#4fae2e]/20 bg-[#eaf8df] text-xs text-[#4fae2e] dark:bg-[#4fae2e]/15"
                >
                  <FileText className="mr-1 h-3 w-3" />
                  {viewingCategory.postCount} posts
                </Badge>
              </div>

              <Separator />

              {/* Slug */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Slug
                </p>
                <code className="block rounded-md bg-muted px-3 py-2 text-sm">
                  {viewingCategory.slug}
                </code>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                {viewingCategory.description ? (
                  <p className="rounded-md bg-muted px-3 py-2 text-sm leading-relaxed">
                    {viewingCategory.description}
                  </p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    No description provided.
                  </p>
                )}
              </div>

              <Separator />

              {/* Footer */}
              <div className="flex items-center justify-end">
                <Link
                  href={`/forum/${viewingCategory.slug}`}
                  target="_blank"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    View on Forum
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
