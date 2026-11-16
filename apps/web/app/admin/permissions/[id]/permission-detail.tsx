"use client";

import { AdminDetailSkeleton } from "../../components/table-skeleton";
import { usePermission } from "@/hooks/use-permission";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  getPermissionFeatureGroup,
  SCOPE_DEFINITIONS,
} from "@/lib/permission-scopes";
import { getPermissionDisplayName } from "@/lib/permission-utils";
import { HttpMethodBadge } from "../../components/http-method-badge";
import { useActionPermission } from "@/hooks/use-action-permission";

export function PermissionDetail({ permissionId }: { permissionId: number }) {
  const t = useTranslations("adminPermissions");
  const tCommon = useTranslations("adminCommon");
  const format = useFormatter();
  const locale = useLocale();
  const { can } = useActionPermission();
  const canViewDetail = can("GET", "/api/permissions/:id");
  const { data: permission, isLoading, isError } = usePermission(permissionId);

  if (!canViewDetail) {
    return (
      <div className="space-y-4">
        <BackToPermissions />
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          {t("detailAccessDenied")}
        </div>
      </div>
    );
  }

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

  const displayName = getPermissionDisplayName(permission, locale);

  return (
    <div className="space-y-6">
      <BackToPermissions />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {displayName}
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {permission.method} {permission.path}
          </p>
        </div>
        <HttpMethodBadge method={permission.method} />
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
          <p className="text-xs text-muted-foreground">{t("permissionName")}</p>
          <p className="text-sm font-medium mt-1">{displayName}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{tCommon("method")}</p>
          <div className="mt-1">
            <HttpMethodBadge method={permission.method} />
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{tCommon("path")}</p>
          <p className="text-sm font-mono mt-1">{permission.path}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">{tCommon("module")}</p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {(() => {
              const group = getPermissionFeatureGroup(permission);
              const scopeDef = SCOPE_DEFINITIONS[group.scope];
              return (
                <>
                  <Badge variant="secondary" className="font-mono text-xs font-semibold">
                    {group.code}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">
                    {locale === "vi" ? group.titleVi : group.titleEn}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[11px] px-2 py-0.5 border ${scopeDef.badgeClass}`}
                  >
                    <span className={`size-1.5 rounded-full mr-1.5 ${scopeDef.dotColor}`} />
                    {locale === "vi" ? scopeDef.labelVi : scopeDef.labelEn}
                  </Badge>
                </>
              );
            })()}
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
