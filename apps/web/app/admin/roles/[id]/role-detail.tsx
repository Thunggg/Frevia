"use client";

import { DeleteRoleDialog } from "../components/delete-role-dialog";
import { UpdateRoleDialog } from "../components/update-role-dialog";
import { AdminDetailSkeleton } from "../../components/table-skeleton";
import { useRole } from "@/hooks/use-role";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { RoleName } from "@shared/types";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SYSTEM_ROLE_NAMES = new Set<string>(Object.values(RoleName));

export function RoleDetail({ roleId }: { roleId: number }) {
  const router = useRouter();
  const t = useTranslations("adminRoles");
  const tCommon = useTranslations("adminCommon");
  const format = useFormatter();
  const { data: role, isLoading, isError } = useRole(roleId);

  if (isLoading) {
    return <AdminDetailSkeleton />;
  }

  if (isError || !role) {
    return (
      <div className="space-y-4">
        <BackToRoles />
        <p className="text-sm text-muted-foreground py-12 text-center">
          {t("detailLoadFailed")}
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
          <p className="text-muted-foreground mt-1">{t("detailTitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <UpdateRoleDialog
            role={role}
            trigger={
              <Button size="sm" className="gap-1.5">
                <Pencil className="h-4 w-4" />
                {tCommon("edit")}
              </Button>
            }
          />
          <DeleteRoleDialog
            role={role}
            onDeleted={() => router.push("/admin/roles")}
            trigger={
              <Button size="sm" variant="destructive" className="gap-1.5">
                <Trash2 className="h-4 w-4" />
                {tCommon("delete")}
              </Button>
            }
          />
          <Badge variant={isSystem ? "secondary" : "outline"}>
            {isSystem ? tCommon("system") : tCommon("custom")}
          </Badge>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{tCommon("id")}</p>
            <p className="font-mono text-sm mt-1">{role.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {tCommon("created")}
            </p>
            <p className="text-sm mt-1">
              {format.dateTime(new Date(role.createdAt), {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs text-muted-foreground">{tCommon("name")}</p>
          <p className="text-sm font-medium mt-1">{role.name}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            {tCommon("description")}
          </p>
          <p className="text-sm mt-1">{role.description || tCommon("empty")}</p>
        </div>
      </div>
    </div>
  );
}

function BackToRoles() {
  const t = useTranslations("adminRoles");

  return (
    <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
      <Link href="/admin/roles">
        <ArrowLeft className="h-4 w-4" />
        {t("backToRoles")}
      </Link>
    </Button>
  );
}
