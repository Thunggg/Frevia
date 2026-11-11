"use client";

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
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  LogOut,
  MonitorSmartphone,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminProfileDropdown() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const tNav = useTranslations("nav");
  const tRole = useTranslations("roleName");

  const displayName =
    me?.profile?.displayName || me?.email?.split("@")[0] || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

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
              {tRole("ADMIN")}
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
