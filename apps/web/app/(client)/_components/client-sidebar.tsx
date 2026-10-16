"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  Bell,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  HelpCircle,
  Heart,
  LogOut,
  MessageSquare,
  MonitorSmartphone,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  SwitchCamera,
  UserRound,
} from "@/components/icons";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { toastError } from "@repo/ui/components/shadcn/toast";
import { authApiRequest } from "@/apiRequests/auth";
import { useMe } from "@/hooks/use-auth";
import { RoleName } from "@shared/types";

import { useNotifications } from "@/hooks/use-notifications";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  matchPrefix?: boolean;
  badge?: number | string;
};

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = item.matchPrefix
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
        isActive
          ? "bg-[#D0E1F8] text-[#0069D3] dark:bg-[#0069D3]/20 dark:text-blue-200 font-semibold shadow-xs"
          : "text-muted-foreground hover:bg-[#D0E1F8]/30 dark:hover:bg-zinc-800/60 hover:text-[#0069D3] dark:hover:text-blue-200"
      } ${collapsed ? "justify-center px-2.5" : ""}`}
    >
      <div className="relative shrink-0">
        <Icon
          className={`transition-colors ${
            isActive
              ? "text-[#0069D3] dark:text-blue-300"
              : "text-muted-foreground group-hover:text-[#0069D3] dark:group-hover:text-blue-300"
          } ${collapsed ? "size-5" : "size-4"}`}
        />
        {collapsed && item.badge ? (
          <span className="absolute -top-1 -right-1 flex size-2 rounded-full bg-[#0069D3] ring-2 ring-[#F6F5F9] dark:ring-zinc-950" />
        ) : null}
      </div>
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && (
        <div className="ml-auto flex items-center gap-1.5">
          {item.badge ? (
            <span className="flex items-center justify-center rounded-full bg-[#0069D3] px-2 py-0.5 text-xs font-bold text-white shadow-xs">
              {item.badge}
            </span>
          ) : null}
          {isActive && (
            <ChevronRight className="size-3.5 text-[#0069D3] dark:text-blue-300" />
          )}
        </div>
      )}
    </Link>
  );
}

export function ClientSidebar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const { data: notifications = [] } = useNotifications();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const clientNav: NavItem[] = [
    {
      href: "/client/jobs",
      label: "My Jobs",
      icon: Briefcase,
      matchPrefix: true,
    },
    {
      href: "/client/contracts",
      label: "Contracts",
      icon: FileText,
      matchPrefix: true,
    },
    {
      href: "/client/conversations",
      label: "Messages",
      icon: MessageSquare,
      matchPrefix: true,
    },
    {
      href: "/client/notifications",
      label: "Notifications",
      icon: Bell,
      matchPrefix: true,
      badge:
        unreadNotifications > 0
          ? unreadNotifications > 99
            ? "99+"
            : unreadNotifications
          : undefined,
    },
  ];

  const displayName = me?.profile?.displayName ?? "Client";
  const initial = displayName.charAt(0).toUpperCase();
  const canSwitchRole = me?.roles.some(
    (r) => r.name === RoleName.FREELANCER,
  );

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const switchRole = async () => {
    if (!canSwitchRole || isSwitchingRole) return;
    setIsSwitchingRole(true);
    try {
      await authApiRequest.switchRole({ role: RoleName.FREELANCER });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.push("/freelancer/find-work");
      router.refresh();
    } catch {
      toastError({ message: "Unable to switch role. Please try again." });
      setIsSwitchingRole(false);
    }
  };

  return (
    <aside
      className={`sticky top-0 flex h-dvh shrink-0 flex-col border-r border-border bg-[#F6F5F9] dark:bg-zinc-950 transition-all duration-300 ${
        collapsed ? "w-[60px]" : "w-[300px]"
      }`}
    >
      {/* Logo & Collapse toggle */}
      <div
        className={`relative flex h-14 shrink-0 items-center border-b border-border ${
          collapsed ? "justify-center px-0" : "justify-between px-5"
        }`}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {collapsed && (
            <Image
              src="/frevia-mark.png"
              alt="Frevia"
              width={26}
              height={26}
              className="size-[26px] shrink-0 object-contain"
              priority
            />
          )}
          {!collapsed && (
            <span className="font-semibold text-3xl tracking-tight">
              Frevia
            </span>
          )}
        </Link>

        {!collapsed ? (
          <button
            onClick={() => setCollapsed(true)}
            title="Collapse sidebar"
            className="z-10 flex size-6 items-center justify-center text-muted-foreground hover:text-[#0069D3] dark:hover:text-blue-300 cursor-pointer"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(false)}
            title="Expand sidebar"
            className="absolute inset-0 z-20 flex items-center justify-center bg-[#F6F5F9] dark:bg-zinc-950 opacity-0 transition-opacity hover:opacity-100 cursor-pointer"
          >
            <PanelLeftOpen className="size-5 text-foreground" />
          </button>
        )}
      </div>

      {/* ── Profile block (top) ── */}
      <div className="border-b border-border px-2.5 py-3">
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-[#D0E1F8]/30 dark:hover:bg-zinc-800/60 ${
              collapsed ? "justify-center" : ""
            }`}
            aria-label="Profile menu"
          >
            <Avatar className="size-8 shrink-0">
              {me?.profile?.avatarUrl && (
                <AvatarImage src={me.profile.avatarUrl} alt={displayName} />
              )}
              <AvatarFallback className="bg-[#D0E1F8] text-[11px] font-bold text-[#0069D3] dark:bg-[#0069D3]/30 dark:text-blue-200">
                {initial}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Client</p>
                </div>
                <ChevronDown
                  className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />
              </>
            )}
          </button>

          {/* Profile popover */}
          {profileOpen && (
            <div
              className={`absolute top-full mt-1 z-50 min-w-[200px] rounded-2xl border border-border bg-popover p-1.5 shadow-xl ${
                collapsed ? "left-full ml-2 top-0" : "left-0 right-0"
              }`}
            >
              {me?.id && (
                <Link
                  href={`/clients/${me.id}`}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#D0E1F8]/40 dark:hover:bg-zinc-800 hover:text-[#0069D3] dark:hover:text-blue-300 transition-colors"
                >
                  <Eye className="size-3.5" />
                  View public profile
                </Link>
              )}
              <Link
                href="/client/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#D0E1F8]/40 dark:hover:bg-zinc-800 hover:text-[#0069D3] dark:hover:text-blue-300 transition-colors"
              >
                <UserRound className="size-3.5" />
                Profile settings
              </Link>
              <Link
                href="/client/profile?tab=favorites"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#D0E1F8]/40 dark:hover:bg-zinc-800 hover:text-[#0069D3] dark:hover:text-blue-300 transition-colors"
              >
                <Heart className="size-3.5" />
                Favorite freelancers
              </Link>
              <Link
                href="/sessions"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#D0E1F8]/40 dark:hover:bg-zinc-800 hover:text-[#0069D3] dark:hover:text-blue-300 transition-colors"
              >
                <MonitorSmartphone className="size-3.5" />
                Sessions
              </Link>

              <div className="my-1 h-px bg-border" />

              {/* Theme switcher */}
              <div className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2.5 font-medium">
                  {isDark ? (
                    <Moon className="size-3.5 text-blue-400" />
                  ) : (
                    <Sun className="size-3.5 text-amber-500" />
                  )}
                  <span>Theme</span>
                </span>
                <div className="flex items-center gap-0.5 rounded-full bg-[#F1F0F5] dark:bg-zinc-800 p-0.5 border border-black/5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`flex size-6 items-center justify-center rounded-full transition-all cursor-pointer ${
                      !isDark
                        ? "bg-white text-[#0069D3] shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Light mode"
                    aria-label="Switch to light mode"
                  >
                    <Sun className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`flex size-6 items-center justify-center rounded-full transition-all cursor-pointer ${
                      isDark
                        ? "bg-zinc-700 text-amber-300 shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Dark mode"
                    aria-label="Switch to dark mode"
                  >
                    <Moon className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="my-1 h-px bg-border" />

              {canSwitchRole && (
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    void switchRole();
                  }}
                  disabled={isSwitchingRole}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#D0E1F8]/40 dark:hover:bg-zinc-800 hover:text-[#0069D3] dark:hover:text-blue-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <SwitchCamera className="size-3.5" />
                  {isSwitchingRole ? "Switching..." : "Switch to Freelancer"}
                </button>
              )}
              <button
                onClick={() => {
                  setProfileOpen(false);
                  void logout();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="size-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        {!collapsed && (
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Client
          </p>
        )}
        <div className="space-y-0.5">
          {clientNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* ── Bottom: Help ── */}
      <div className="border-t border-border px-2.5 py-3">
        {!collapsed && (
          <Link
            href="/forum"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-muted-foreground/60 transition-colors hover:text-[#0069D3] dark:hover:text-blue-300"
          >
            <HelpCircle className="size-3.5" />
            Help & Forum
          </Link>
        )}
      </div>
    </aside>
  );
}