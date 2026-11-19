"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { RoleName } from "@shared/types";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { authApiRequest } from "@/apiRequests/auth";
import { useMe } from "@/hooks/use-auth";

export type MarketplaceRole = "CLIENT" | "FREELANCER";

export function useMarketplaceRoleAction(currentRole: MarketplaceRole) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const tNav = useTranslations("nav");
  const { data: me, isLoading: isMeLoading } = useMe();
  const [isPending, setIsPending] = useState(false);

  const primaryRole =
    me?.roles?.find((item) => item.isPrimary)?.name ?? me?.roles?.[0]?.name;
  const isMarketplaceUser =
    primaryRole === RoleName.CLIENT || primaryRole === RoleName.FREELANCER;

  const targetRole =
    currentRole === "FREELANCER" ? RoleName.CLIENT : RoleName.FREELANCER;
  const hasTargetRole =
    me?.roles?.some((item) => item.name === targetRole) === true;
  const targetRoleLabel =
    targetRole === RoleName.CLIENT
      ? tNav("roles.client")
      : tNav("roles.freelancer");

  const executeRoleAction = async (redirectTo?: string | null) => {
    if (isMeLoading || !me || !isMarketplaceUser || isPending) {
      return false;
    }

    setIsPending(true);
    try {
      if (hasTargetRole) {
        await authApiRequest.switchRole({ role: targetRole });
      } else {
        await authApiRequest.joinRole({ role: targetRole });
      }

      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toastSuccess({
        message: hasTargetRole
          ? tNav("switchedToRole", { role: targetRoleLabel })
          : tNav("roleAdded", { role: targetRoleLabel }),
      });

      const safeRedirect =
        redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
          ? redirectTo
          : targetRole === RoleName.CLIENT
            ? "/client/jobs"
            : "/freelancer";

      router.push(safeRedirect);
      router.refresh();
      return true;
    } catch {
      toastError({
        message: hasTargetRole
          ? tNav("switchRoleFailed")
          : tNav("addRoleFailed"),
      });
      return false;
    } finally {
      setIsPending(false);
    }
  };

  const actionLabel = isMeLoading
    ? tNav("loadingRoles")
    : isPending
      ? hasTargetRole
        ? tNav("switchingRole")
        : tNav("addingRole")
      : hasTargetRole
        ? tNav("switchToRole", { role: targetRoleLabel })
        : tNav("addRole", { role: targetRoleLabel });

  return {
    me,
    isMarketplaceUser,
    hasTargetRole,
    isMeLoading,
    isPending,
    targetRole,
    targetRoleLabel,
    actionLabel,
    executeRoleAction,
  };
}
