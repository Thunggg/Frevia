"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RoleName, type GetMeResType } from "@shared/types";
import { authApiRequest } from "@/apiRequests/auth";
import { Header, type UserRole } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  ShieldAlert,
  Lock,
  LayoutDashboard,
  ArrowRight,
  Loader2,
  LogOut,
  RefreshCw,
} from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";

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
  const router = useRouter();
  const t = useTranslations("accessDenied");
  const tRole = useTranslations("roleName");
  const queryClient = useQueryClient();
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const primaryRole =
    user?.roles.find((r) => r.isPrimary)?.name ?? user?.roles[0]?.name;

  const targetRequiredRole:
    | typeof RoleName.CLIENT
    | typeof RoleName.FREELANCER
    | null =
    requiredRole?.toLowerCase() === "client"
      ? RoleName.CLIENT
      : requiredRole?.toLowerCase() === "freelancer"
        ? RoleName.FREELANCER
        : null;

  // Check if current user has the required role and can switch to it
  const canSwitchToRequired = Boolean(
    user &&
      targetRequiredRole &&
      user.roles.some((r) => r.name === targetRequiredRole) &&
      primaryRole !== targetRequiredRole,
  );

  const handleSwitchRole = async (
    targetRole: typeof RoleName.CLIENT | typeof RoleName.FREELANCER,
  ) => {
    if (isSwitchingRole) return;
    setIsSwitchingRole(true);
    try {
      await authApiRequest.switchRole({ role: targetRole });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toastSuccess({
        message: t("switchedRole", {
          role:
            targetRole === RoleName.CLIENT
              ? tRole("CLIENT")
              : tRole("FREELANCER"),
        }),
      });
      if (from && from.startsWith("/") && !from.startsWith("//")) {
        router.push(from);
      } else if (targetRole === RoleName.CLIENT) {
        router.push("/client/jobs");
      } else {
        router.push("/freelancer/find-work");
      }
      router.refresh();
    } catch {
      toastError({ message: t("roleSwitchFailed") });
      setIsSwitchingRole(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await queryClient.clear();
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const currentRoleDashboardUrl =
    primaryRole === RoleName.CLIENT
      ? "/client/jobs"
      : primaryRole === RoleName.FREELANCER
        ? "/freelancer/find-work"
        : primaryRole === RoleName.ADMIN
          ? "/admin"
          : "/";

  const primaryRoleLabel =
    primaryRole === RoleName.CLIENT
      ? tRole("CLIENT")
      : primaryRole === RoleName.FREELANCER
        ? tRole("FREELANCER")
        : primaryRole === RoleName.ADMIN
          ? tRole("ADMIN")
          : t("userFallback");

  const requiredRoleLabel =
    targetRequiredRole === RoleName.CLIENT
      ? tRole("CLIENT")
      : targetRequiredRole === RoleName.FREELANCER
        ? tRole("FREELANCER")
        : requiredRole?.toLowerCase() === "admin"
          ? tRole("ADMIN")
          : t("requiredRoleFallback");

  const headerRole: UserRole =
    primaryRole === RoleName.CLIENT
      ? "CLIENT"
      : primaryRole === RoleName.FREELANCER
        ? "FREELANCER"
        : "GUEST";

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={headerRole} />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl text-center">
          {/* Icon Badge */}
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-500/20 mb-6">
            {user ? (
              <ShieldAlert className="size-8" />
            ) : (
              <Lock className="size-8" />
            )}
          </div>

          <Badge variant="outline" className="mb-3 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30">
            {t("badge")}
          </Badge>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>

          {/* Unauthenticated State */}
          {!user ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("unauthenticatedMessage")}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  className="bg-[#4fae2e] text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:hover:bg-[#5bc03a]"
                  asChild
                >
                  <Link href={from ? `/login?redirect=${encodeURIComponent(from)}` : "/login"}>
                    {t("signInNow")}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">{t("backHome")}</Link>
                </Button>
              </div>
            </div>
          ) : (
            /* Authenticated State */
            <div className="mt-4 space-y-5">
              {/* User Role Card */}
              <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/40 p-3.5 text-left">
                <Avatar className="size-11 border border-border">
                  <AvatarImage
                    src={user.profile?.avatarUrl ?? undefined}
                    alt={user.profile?.displayName ?? user.email}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {(user.profile?.displayName?.[0] ?? user.email[0] ?? "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-foreground">
                    {user.profile?.displayName ?? user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0 font-medium">
                  {primaryRoleLabel}
                </Badge>
              </div>

              {/* Message */}
              <p className="text-sm text-muted-foreground leading-relaxed text-left">
                {t.rich("requiredAccount", {
                  role: requiredRoleLabel,
                  current: primaryRoleLabel,
                  strong: (chunks) => (
                    <strong className="text-foreground">{chunks}</strong>
                  ),
                })}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                {/* 1. Go to current role's dashboard */}
                <Button
                  className="w-full bg-[#4fae2e] text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:hover:bg-[#5bc03a] font-medium"
                  asChild
                >
                  <Link href={currentRoleDashboardUrl}>
                    <LayoutDashboard className="mr-2 size-4" />
                    {t("goToDashboard", { role: primaryRoleLabel })}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>

                {/* 2. Switch role if user has target role */}
                {canSwitchToRequired && targetRequiredRole && (
                  <Button
                    variant="outline"
                    className="w-full border-primary/40 hover:bg-primary/5 text-primary font-medium"
                    onClick={() => handleSwitchRole(targetRequiredRole)}
                    disabled={isSwitchingRole}
                  >
                    {isSwitchingRole ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 size-4" />
                    )}
                    {t("switchToRole", { role: requiredRoleLabel })}
                  </Button>
                )}

                {/* 3. Secondary Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="ghost"
                    className="flex-1 text-xs text-muted-foreground hover:text-foreground"
                    asChild
                  >
                    <Link href="/">{t("backHome")}</Link>
                  </Button>

                  <Button
                    variant="ghost"
                    className="flex-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <LogOut className="mr-1.5 size-3.5" />
                    )}
                    {t("switchAccount")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
