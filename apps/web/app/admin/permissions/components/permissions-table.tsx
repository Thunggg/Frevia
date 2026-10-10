"use client";

import { usePermissions } from "@/hooks/use-permission";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { HttpMethod } from "@shared/types";
import { Eye, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

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

export function PermissionsTable() {
  const { data: permissions = [], isLoading, isError } = usePermissions();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return permissions;

    return permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.path.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q) ||
        (p.module?.toLowerCase().includes(q) ?? false) ||
        String(p.id).includes(q),
    );
  }, [permissions, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Permission Management
        </h1>
        <p className="text-muted-foreground mt-1">
          View all API permissions in the system
          {!isLoading && !isError ? ` (${permissions.length} total)` : ""}
        </p>
      </div>

      {!isLoading && !isError && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, path, method, module..."
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
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
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="w-24">Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    {search
                      ? "No permissions match your search."
                      : "No permissions found."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((permission) => (
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
      )}
    </div>
  );
}
