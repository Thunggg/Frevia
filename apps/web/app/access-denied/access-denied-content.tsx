"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { RoleName, type GetMeResType } from "@shared/types";
import { canAccessAdminPortal } from "@/lib/admin-access";
import { useMarketplaceRoleAction } from "@/hooks/use-marketplace-role-action";
import { Button } from "@repo/ui/components/shadcn/button";

type AccessDeniedContentProps = {
  user: GetMeResType | null;
  requiredRole?: string | null;
  from?: string | null;
};

export function AccessDeniedContent({
  user,
  requiredRole,
  from,
}: AccessDeniedContentProps) {
  const t = useTranslations("accessDenied");
  const tRole = useTranslations("roleName");

  const primaryRole =
    user?.roles.find((r) => r.isPrimary)?.name ?? user?.roles[0]?.name;

  const isStaffRole =
    Boolean(user) &&
    primaryRole !== RoleName.CLIENT &&
    primaryRole !== RoleName.FREELANCER;

  const {
    hasTargetRole,
    isPending: isRoleActionPending,
    actionLabel: marketplaceRoleActionLabel,
    executeRoleAction,
  } = useMarketplaceRoleAction(
    primaryRole === RoleName.FREELANCER ? "FREELANCER" : "CLIENT",
  );

  const requiredRoleLower = requiredRole?.toLowerCase();

  const isTargetOppositeMarketplaceRole =
    Boolean(user) &&
    !isStaffRole &&
    ((primaryRole === RoleName.CLIENT &&
      requiredRoleLower === "freelancer") ||
      (primaryRole === RoleName.FREELANCER &&
        requiredRoleLower === "client"));

  const primaryRoleLabel =
    primaryRole === RoleName.CLIENT
      ? tRole("CLIENT")
      : primaryRole === RoleName.FREELANCER
        ? tRole("FREELANCER")
        : primaryRole === RoleName.ADMIN
          ? tRole("ADMIN")
          : primaryRole === RoleName.EXPERT
            ? tRole("EXPERT")
            : primaryRole ?? t("userFallback");

  const requiredRoleLabel =
    requiredRoleLower === "client"
      ? tRole("CLIENT")
      : requiredRoleLower === "freelancer"
        ? tRole("FREELANCER")
        : requiredRoleLower === "admin"
          ? tRole("ADMIN")
          : requiredRoleLower === "expert"
            ? tRole("EXPERT")
            : requiredRole ?? t("requiredRoleFallback");

  const dashboardUrl =
    primaryRole === RoleName.CLIENT
      ? "/client/jobs"
      : primaryRole === RoleName.FREELANCER
        ? "/freelancer"
        : user && canAccessAdminPortal(user)
          ? "/admin"
          : "/forum";

  const dashboardLabel = t("goToDashboard", {
    role: primaryRoleLabel,
  });

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 font-sans sm:p-8 dark:bg-zinc-950">
      <div className="flex min-h-[460px] w-full max-w-xl flex-col items-center justify-center text-center">
        {/* TITLE */}
        <span className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          {t("badge")}
        </span>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
          {t("title")}
        </h1>

        {/* DESCRIPTION */}
        <p className="mb-8 max-w-lg text-sm leading-relaxed text-zinc-500 sm:text-base dark:text-zinc-400">
          {!user ? (
            t("unauthenticatedMessage")
          ) : (
            t.rich("requiredAccount", {
              role: requiredRoleLabel,
              current: primaryRoleLabel,
              strong: (chunks) => (
                <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {chunks}
                </strong>
              ),
            })
          )}
        </p>

        {/* ACTION BUTTONS */}
        <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          {!user ? (
            <>
              <Button
                asChild
                className="rounded-full bg-blue-600 px-8 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Link
                  href={
                    from
                      ? `/login?redirect=${encodeURIComponent(from)}`
                      : "/login"
                  }
                >
                  {t("signInNow")}
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="rounded-full px-8"
              >
                <Link href="/">{t("backHome")}</Link>
              </Button>
            </>
          ) : (
            <>
              {/* GO TO DASHBOARD */}
              <Button
                asChild
                className="rounded-full bg-blue-600 px-8 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Link href={dashboardUrl}>
                  {dashboardLabel}
                </Link>
              </Button>

              {/* SWITCH ROLE */}
              {isTargetOppositeMarketplaceRole && (
                <Button
                  variant="outline"
                  className="rounded-full px-8 text-sm font-medium"
                  onClick={() => void executeRoleAction(from)}
                  disabled={isRoleActionPending}
                >
                  {hasTargetRole
                    ? t("switchToRole", { role: requiredRoleLabel })
                    : marketplaceRoleActionLabel}
                </Button>
              )}

              {/* STAFF: BACK HOME */}
              {isStaffRole && (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full px-8"
                >
                  <Link href="/">{t("backHome")}</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}