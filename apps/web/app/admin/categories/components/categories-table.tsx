"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Eye,
  Pencil,
  Trash2,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { AdminPagination } from "../../components/admin-pagination";
import { UpdateCategoryDialog } from "./update-category-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingCategory, setEditingCategory] =
    useState<ForumCategoryType | null>(null);
  const [deletingCategory, setDeletingCategory] =
    useState<ForumCategoryType | null>(null);

  const currentSortBy = searchParams.get("sortBy") || "id";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

  const handleSort = (column: "id" | "name" | "createdAt") => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSortBy === column) {
      const nextOrder = currentSortOrder === "asc" ? "desc" : "asc";
      params.set("sortOrder", nextOrder);
    } else {
      params.set("sortBy", column);
      params.set("sortOrder", "desc");
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const renderSortIcon = (column: "id" | "name" | "createdAt") => {
    if (currentSortBy !== column) {
      return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />;
    }
    return currentSortOrder === "asc" ? (
      <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-[#4fae2e]" />
    ) : (
      <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-[#4fae2e]" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20">
                <button
                  type="button"
                  onClick={() => handleSort("id")}
                  className="flex items-center font-semibold hover:text-foreground"
                >
                  ID {renderSortIcon("id")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="flex items-center font-semibold hover:text-foreground"
                >
                  Name {renderSortIcon("name")}
                </button>
              </TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center font-semibold hover:text-foreground"
                >
                  Created {renderSortIcon("createdAt")}
                </button>
              </TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
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
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/admin/categories/${category.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingCategory(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeletingCategory(category)}
                      >
                        <Trash2 className="h-4 w-4" />
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

      <UpdateCategoryDialog
        category={editingCategory}
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
      />

      <DeleteCategoryDialog
        category={deletingCategory}
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      />
    </div>
  );
}
