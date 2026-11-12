"use client";

import { useState } from "react";
import { authApiRequest } from "@/apiRequests/auth";
import { useMe } from "@/hooks/use-auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { toastError } from "@repo/ui/components/shadcn/toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  LogOut,
  MonitorSmartphone,
  SwitchCamera,
  UserRound,
} from "lucide-react";
import { RoleName } from "@shared/types";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

const KNOWN_ROLES = new Set<string>([
  RoleName.ADMIN,
  RoleName.CLIENT,
  RoleName.FREELANCER,
  RoleName.EXPERT,
]);

export function AdminProfileDropdown() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const tNav = useTranslations("nav");
  const tRole = useTranslations("roleName");
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const displayName =
    me?.profile?.displayName || me?.email?.split("@")[0] || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  const primaryRole =
    me?.roles?.find((r) => r.isPrimary)?.name ?? me?.roles?.[0]?.name ?? "ADMIN";
  const roleLabel =
    primaryRole === RoleName.ADMIN
      ? tRole("ADMIN")
      : primaryRole === RoleName.EXPERT
        ? tRole("EXPERT")
        : primaryRole === RoleName.CLIENT
          ? tRole("CLIENT")
          : primaryRole === RoleName.FREELANCER
            ? tRole("FREELANCER")
            : primaryRole;

  const otherRoles = me?.roles?.filter((r) => !r.isPrimary) ?? [];

  const handleSwitchRole = async (targetRoleName: string) => {
    if (isSwitchingRole) return;
    setIsSwitchingRole(true);
    try {
      await authApiRequest.switchRole({ role: targetRoleName });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      let destination = "/";
      if (targetRoleName === RoleName.CLIENT) {
        destination = "/client/jobs";
      } else if (targetRoleName === RoleName.FREELANCER) {
        destination = "/freelancer";
      } else if (targetRoleName === RoleName.EXPERT) {
        destination = "/admin/disputes";
      } else {
        destination = "/admin";
      }
      router.push(destination);
      router.refresh();
    } catch {
      toastError({ message: tNav("switchRoleFailed") });
      setIsSwitchingRole(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    queryClient.clear();
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full px-2 py-1 outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-[#4fae2e]/30 dark:hover:bg-white/[0.06] cursor-pointer"
          aria-label={tNav("openProfileMenu")}
        >
          <Avatar className="size-8">
            {me?.profile?.avatarUrl && (
              <AvatarImage src={me.profile.avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className="bg-[#4fae2e]/10 text-[11px] font-semibold text-[#4fae2e]">
              {initial}
            </AvatarFallback>
          </Avatar>
          <ChevronDown
            className="size-3.5 text-muted-foreground"
            strokeWidth={2}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1.5">
        <DropdownMenuLabel className="flex items-center gap-3 px-2.5 py-3">
          <Avatar size="lg">
            {me?.profile?.avatarUrl && (
              <AvatarImage src={me.profile.avatarUrl} alt={displayName} />
            )}
            <AvatarFallback className="bg-[#4fae2e]/10 text-sm font-semibold text-[#4fae2e]">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {me?.email ?? ""}
            </p>
            <span className="mt-1 inline-flex items-center rounded-full bg-[#4fae2e]/10 px-2 py-0.5 text-[10px] font-medium text-[#4fae2e]">
              {roleLabel}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/profile" className="cursor-pointer">
            <UserRound className="size-4 text-muted-foreground" />
            {tNav("profileSettings")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/sessions" className="cursor-pointer">
            <MonitorSmartphone className="size-4 text-muted-foreground" />
            {tNav("sessions")}
          </Link>
        </DropdownMenuItem>
        {otherRoles.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {tNav("switchRole")}
            </DropdownMenuLabel>
            {otherRoles.map((role) => (
              <DropdownMenuItem
                key={role.id}
                disabled={isSwitchingRole}
                onSelect={() => void handleSwitchRole(role.name)}
                className="cursor-pointer"
              >
                <SwitchCamera className="size-4 text-muted-foreground" />
                <span>
                  {tNav("switchToRole", {
                    role:
                      role.name === RoleName.ADMIN
                        ? tRole("ADMIN")
                        : role.name === RoleName.EXPERT
                          ? tRole("EXPERT")
                          : role.name === RoleName.CLIENT
                            ? tRole("CLIENT")
                            : role.name === RoleName.FREELANCER
                              ? tRole("FREELANCER")
                              : role.name,
                  })}
                </span>
              </DropdownMenuItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={handleLogout}
          className="cursor-pointer"
        >
          <LogOut className="size-4" />
          {tNav("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
