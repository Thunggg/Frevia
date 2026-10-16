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
import type { BannerAdminItemType } from "@shared/types";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { NumberedPagination } from "../../components/numbered-pagination";
import { BannerFormDialog } from "./banner-form-dialog";
import { DeleteBannerDialog } from "./delete-banner-dialog";
import { RestoreBannerDialog } from "./restore-banner-dialog";
import { bannerPositionLabel } from "../constants";

interface BannersTableProps {
  banners: BannerAdminItemType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type SortBy = "id" | "createdAt";

function formatDate(value: Date | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString();
}

export function BannersTable({ banners, pagination }: BannersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deletingBanner, setDeletingBanner] =
    useState<BannerAdminItemType | null>(null);

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
                  ID
                  <SortIcon column="id" />
                </button>
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
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
            {banners.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  No banners found.
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner.id} className="group">
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {banner.id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {banner.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- thumbnail */
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="h-8 w-12 rounded border object-cover bg-muted"
                        />
                      ) : null}
                      <span className="font-medium text-sm text-foreground">
                        {banner.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {bannerPositionLabel(banner.position)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(banner.startDate)} → {formatDate(banner.endDate)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {banner.deletedAt !== null ? (
                        <Badge variant="destructive">Deleted</Badge>
                      ) : banner.isActive ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 border"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(banner.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {banner.deletedAt === null ? (
                        <>
                          <BannerFormDialog banner={banner} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Delete banner"
                            aria-label={`Delete banner ${banner.title}`}
                            onClick={() => setDeletingBanner(banner)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <RestoreBannerDialog banner={banner} />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
                        title="View details"
                      >
                        <Link
                          href={`/admin/banners/${banner.id}`}
                          aria-label={`View details of ${banner.title}`}
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

      <DeleteBannerDialog
        banner={deletingBanner}
        open={!!deletingBanner}
        onOpenChange={(open) => !open && setDeletingBanner(null)}
      />
    </div>
  );
}