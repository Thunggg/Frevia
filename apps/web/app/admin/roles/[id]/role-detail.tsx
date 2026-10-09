"use client";

import { UpdateRoleDialog } from "../components/update-role-dialog";
import { useRole } from "@/hooks/use-role";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { RoleName } from "@shared/types";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

const SYSTEM_ROLE_NAMES = new Set<string>(Object.values(RoleName));

export function RoleDetail({ roleId }: { roleId: number }) {
  const { data: role, isLoading, isError } = useRole(roleId);

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Loading role...
      </p>
    );
  }

  if (isError || !role) {
    return (
      <div className="space-y-4">
        <BackToRoles />
        <p className="text-sm text-muted-foreground py-12 text-center">
          Failed to load role detail. The role may not exist.
        </p>
      </div>
    );
  }

  const isSystem = SYSTEM_ROLE_NAMES.has(role.name);

  return (
    <div className="space-y-6">
      <BackToRoles />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{role.name}</h1>
          <p className="text-muted-foreground mt-1">Role detail</p>
        </div>
        <div className="flex items-center gap-2">
          <UpdateRoleDialog
            role={role}
            trigger={
              <Button size="sm" className="gap-1.5">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            }
          />
          <Badge variant={isSystem ? "secondary" : "outline"}>
            {isSystem ? "System" : "Custom"}
          </Badge>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">ID</p>
            <p className="font-mono text-sm mt-1">{role.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="text-sm mt-1">
              {new Date(role.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="text-sm font-medium mt-1">{role.name}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Description</p>
          <p className="text-sm mt-1">{role.description || "—"}</p>
        </div>
      </div>
    </div>
  );
}

function BackToRoles() {
  return (
    <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
      <Link href="/admin/roles">
        <ArrowLeft className="h-4 w-4" />
        Back to roles
      </Link>
    </Button>
  );
}
