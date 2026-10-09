"use client";

import { useRoles } from "@/hooks/use-role";
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
import { RoleName } from "@shared/types";
import { Eye } from "lucide-react";
import Link from "next/link";

const SYSTEM_ROLE_NAMES = new Set<string>(Object.values(RoleName));

export function RolesTable() {
  const { data: roles = [], isLoading, isError } = useRoles();

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Loading roles...
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Failed to load roles. Please try again.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
        <p className="text-muted-foreground mt-1">
          View all roles in the system ({roles.length} total)
        </p>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No roles found.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => {
                const isSystem = SYSTEM_ROLE_NAMES.has(role.name);

                return (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {role.id}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate">
                      {role.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isSystem ? "secondary" : "outline"}>
                        {isSystem ? "System" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                      {new Date(role.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/admin/roles/${role.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
