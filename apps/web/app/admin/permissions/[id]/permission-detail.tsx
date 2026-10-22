"use client";

import { AdminDetailSkeleton } from "../../components/table-skeleton";
import { usePermission } from "@/hooks/use-permission";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { HttpMethod } from "@shared/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";

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

export function PermissionDetail({ permissionId }: { permissionId: number }) {
  const t = useTranslations("adminPermissions");
  const tCommon = useTranslations("adminCommon");
  const format = useFormatter();
  const { data: permission, isLoading, isError } = usePermission(permissionId);

  if (isLoading) {
    return <AdminDetailSkeleton />;
  }

  if (isError || !permission) {
    return (
      <div className="space-y-4">
        <BackToPermissions />
        <p className="text-sm text-muted-foreground py-12 text-center">
          {t("detailLoadFailed")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackToPermissions />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">
            {permission.name}
          </h1>
          <p className="text-muted-foreground mt-1">{t("detailTitle")}</p>
        </div>
        <Badge variant={METHOD_VARIANT[permission.method] ?? "outline"}>
          {permission.method}
        </Badge>
      </div>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">{tCommon("id")}</p>
            <p className="font-mono text-sm mt-1">{permission.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {tCommon("created")}
            </p>
            <p className="text-sm mt-1">
              {format.dateTime(new Date(permission.createdAt), {
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
          <p className="text-sm font-medium font-mono mt-1">{permission.name}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{tCommon("method")}</p>
          <div className="mt-1">
            <Badge variant={METHOD_VARIANT[permission.method] ?? "outline"}>
              {permission.method}
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{tCommon("path")}</p>
          <p className="text-sm font-mono mt-1">{permission.path}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{tCommon("module")}</p>
          <div className="mt-1">
            {permission.module ? (
              <Badge variant="outline">{permission.module}</Badge>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BackToPermissions() {
  const t = useTranslations("adminPermissions");

  return (
    <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
      <Link href="/admin/permissions">
        <ArrowLeft className="h-4 w-4" />
        {t("backToPermissions")}
      </Link>
    </Button>
  );
}
