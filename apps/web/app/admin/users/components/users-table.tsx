"use client";

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
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Shield,
  User,
} from "lucide-react";
import { AdminPagination } from "../../components/admin-pagination";
import type { AdminUserItemType } from "@shared/types";
import { useState } from "react";
import { EditUserDialog } from "./edit-user-dialog";

interface UsersTableProps {
  users: AdminUserItemType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function UsersTable({ users, pagination }: UsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingUser, setEditingUser] = useState<AdminUserItemType | null>(
    null,
  );

  const currentSortBy = searchParams.get("sortBy") || "id";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

  const handleSort = (column: "id" | "email" | "createdAt" | "displayName") => {
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

  const renderSortIcon = (
    column: "id" | "email" | "createdAt" | "displayName",
  ) => {
    if (currentSortBy !== column) {
      return <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />;
    }
    return currentSortOrder === "asc" ? (
      <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-[#4fae2e]" />
    ) : (
      <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-[#4fae2e]" />
    );
  };

  const renderRoleBadge = (roleName: string, isPrimary?: boolean) => {
    const nameLower = roleName.toLowerCase();
    if (nameLower === "client") {
      return (
        <Badge
          key={roleName}
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
        >
          Client {isPrimary && "★"}
        </Badge>
      );
    }
    if (nameLower === "freelancer") {
      return (
        <Badge
          key={roleName}
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
        >
          Freelancer {isPrimary && "★"}
        </Badge>
      );
    }
    if (nameLower === "admin") {
      return (
        <Badge
          key={roleName}
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
        >
          <Shield className="mr-1 h-3 w-3" /> Admin
        </Badge>
      );
    }
    return (
      <Badge key={roleName} variant="secondary">
        {roleName} {isPrimary && "★"}
      </Badge>
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
                  onClick={() => handleSort("displayName")}
                  className="flex items-center font-semibold hover:text-foreground"
                >
                  User {renderSortIcon("displayName")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => handleSort("email")}
                  className="flex items-center font-semibold hover:text-foreground"
                >
                  Email {renderSortIcon("email")}
                </button>
              </TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                <button
                  type="button"
                  onClick={() => handleSort("createdAt")}
                  className="ml-auto flex items-center font-semibold hover:text-foreground"
                >
                  Joined {renderSortIcon("createdAt")}
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="group">
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {user.id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={user.avatarUrl || undefined}
                          alt={user.displayName || user.email}
                        />
                        <AvatarFallback className="bg-muted text-xs">
                          {user.displayName ? (
                            user.displayName.slice(0, 2).toUpperCase()
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {user.displayName || "No Name"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          No Role
                        </span>
                      ) : (
                        user.roles.map((r) =>
                          renderRoleBadge(r.name, r.isPrimary),
                        )
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <Badge variant="destructive" className="text-xs">
                        Banned
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 border"
                      >
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
                        title="View details"
                      >
                        <Link
                          href={`/admin/users/${user.id}`}
                          aria-label={`View details of ${
                            user.displayName || user.email
                          }`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
                        title="Edit user"
                        aria-label={`Edit user ${user.displayName || user.email}`}
                        onClick={() => setEditingUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditUserDialog
        user={editingUser}
        onClose={() => setEditingUser(null)}
      />

      {pagination.totalPages > 1 && (
        <AdminPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
        />
      )}
    </div>
  );
}
