"use client";

import {
  Bell,
  Briefcase,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Eye,
  FileText,
  Heart,
  Languages,
  LogOut,
  MessageSquare,
  MonitorSmartphone,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Sun,
  SwitchCamera,
  UserRound,
  Users,
} from "@/components/icons";
import { setLocaleCookie } from "@/i18n/actions";
import { isLocale, type Locale } from "@/i18n/config";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { authApiRequest } from "@/apiRequests/auth";
import { useMe } from "@/hooks/use-auth";
import { canAccessAdminPortal } from "@/lib/admin-access";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { toastError } from "@repo/ui/components/shadcn/toast";
import { RoleName } from "@shared/types";

import { useNotifications } from "@/hooks/use-notifications";

type NavItem = {
  href: string;
  labelKey?: string;
  label?: string;
  icon: React.ElementType;
  matchPrefix?: boolean;
  badge?: number | string;
};

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const isActive = item.matchPrefix
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href;

  const Icon = item.icon;
  const labelText = item.labelKey ? t(item.labelKey) : (item.label ?? "");

  return (
    <Link
      href={item.href}
      title={collapsed ? labelText : undefined}
      className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-all duration-150 ${
        isActive
          ? "bg-white text-zinc-950 font-semibold shadow-xs dark:bg-zinc-900 dark:text-zinc-50"
          : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-100"
      } ${collapsed ? "justify-center px-2" : ""}`}
    >
      <div className="relative shrink-0">
        <Icon
          className={`transition-colors ${
            isActive
              ? "text-zinc-950 dark:text-zinc-100"
              : "text-zinc-500 group-hover:text-zinc-950 dark:text-zinc-400 dark:group-hover:text-zinc-100"
          } ${collapsed ? "size-5" : "size-4"}`}
        />
        {collapsed && item.badge ? (
          <span className="absolute -top-1 -right-1 flex size-2 rounded-full bg-[#0069D3] ring-2 ring-[#F6F5F9] dark:ring-zinc-950" />
        ) : null}
      </div>
      {!collapsed && <span className="truncate">{labelText}</span>}
      {!collapsed && (
        <div className="ml-auto flex items-center gap-1.5">
          {item.badge ? (
            <span className="flex items-center justify-center rounded-full bg-[#0069D3] px-2 py-0.5 text-xs font-bold text-white shadow-xs">
              {item.badge}
            </span>
          ) : !isActive ? (
            <ChevronRight className="size-3.5 text-zinc-400 opacity-60 group-hover:opacity-100 group-hover:text-zinc-600 dark:text-zinc-500" />
          ) : null}
        </div>
      )}
    </Link>
  );
}

const KNOWN_ROLES = new Set<string>([
  RoleName.ADMIN,
  RoleName.CLIENT,
  RoleName.FREELANCER,
  RoleName.EXPERT,
]);

export function ClientSidebar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("sidebar");
  const tRole = useTranslations("roleName");
  const tNav = useTranslations("nav");
  const activeLocale = useLocale();
  const [isLocalePending, startLocaleTransition] = useTransition();
  const { data: me } = useMe();
  const { data: notifications = [] } = useNotifications();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;

  const selectLocale = (nextLocale: string) => {
    if (!isLocale(nextLocale) || nextLocale === activeLocale) return;
    const targetLocale: Locale = nextLocale;
    startLocaleTransition(async () => {
      await setLocaleCookie(targetLocale);
      router.refresh();
    });
  };

  const clientNav: NavItem[] = [
    {
      href: "/client/jobs",
      labelKey: "navMyJobs",
      icon: Briefcase,
      matchPrefix: true,
    },
    {
      href: "/client/contracts",
      labelKey: "navContracts",
      icon: FileText,
      matchPrefix: true,
    },
    {
      href: "/client/payments",
      labelKey: "navBillingPayments",
      icon: CreditCard,
      matchPrefix: true,
    },
    {
      href: "/client/conversations",
      labelKey: "navMessages",
      icon: MessageSquare,
      matchPrefix: true,
    },
    {
      href: "/forum",
      labelKey: "navForum",
      icon: Users,
      matchPrefix: true,
    },
    {
      href: "/client/notifications",
      labelKey: "navNotifications",
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

  const displayName = me?.profile?.displayName ?? tRole("CLIENT");
  const initial = displayName.charAt(0).toUpperCase();
  const otherRoles = (me?.roles ?? []).filter((r) => !r.isPrimary);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const switchRole = async (targetRoleName: string, destination: string) => {
    if (isSwitchingRole) return;
    setIsSwitchingRole(true);
    try {
      await authApiRequest.switchRole({ role: targetRoleName });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.push(destination);
      router.refresh();
    } catch {
      toastError({ message: t("roleSwitchFailed") });
      setIsSwitchingRole(false);
    }
  };

  return (
    <aside
      className={`sticky top-0 flex h-dvh shrink-0 flex-col border-r border-border bg-[#F6F5F9] dark:bg-zinc-950 transition-all duration-300 ${
        collapsed ? "w-[60px]" : "w-[230px]"
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
            type="button"
            suppressHydrationWarning
            onClick={() => setCollapsed(true)}
            title={t("collapse")}
            className="z-10 flex size-6 items-center justify-center text-muted-foreground hover:text-[#0069D3] dark:hover:text-blue-300 cursor-pointer"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setCollapsed(false)}
            title={t("expand")}
            className="absolute inset-0 z-20 flex items-center justify-center bg-[#F6F5F9] dark:bg-zinc-950 opacity-0 transition-opacity hover:opacity-100 cursor-pointer"
          >
            <PanelLeftOpen className="size-5 text-foreground" />
          </button>
        )}
      </div>

      {/* ── Profile block (top) ── */}
      <div className="border-b border-border px-2.5 py-3">
        <div ref={profileRef} className="relative">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setProfileOpen((v) => !v)}
            className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-[#D0E1F8]/30 dark:hover:bg-zinc-800/60 ${
              collapsed ? "justify-center" : ""
            }`}
            aria-label={t("profileMenu")}
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
                  <p className="text-[10px] text-muted-foreground">
                    {tRole("CLIENT")}
                  </p>
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
                  {t("viewPublicProfile")}
                </Link>
              )}
              <Link
                href="/client/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#D0E1F8]/40 dark:hover:bg-zinc-800 hover:text-[#0069D3] dark:hover:text-blue-300 transition-colors"
              >
                <UserRound className="size-3.5" />
                {t("profileSettings")}
              </Link>
              <Link
                href="/client/profile?tab=favorites"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#D0E1F8]/40 dark:hover:bg-zinc-800 hover:text-[#0069D3] dark:hover:text-blue-300 transition-colors"
              >
                <Heart className="size-3.5" />
                {t("navFavoriteFreelancers")}
              </Link>
              <Link
                href="/client/payments"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#D0E1F8]/40 dark:hover:bg-zinc-800 hover:text-[#0069D3] dark:hover:text-blue-300 transition-colors"
              >
                <CreditCard className="size-3.5" />
                {t("navBillingPayments")}
              </Link>
              <Link
                href="/sessions"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#D0E1F8]/40 dark:hover:bg-zinc-800 hover:text-[#0069D3] dark:hover:text-blue-300 transition-colors"
              >
                <MonitorSmartphone className="size-3.5" />
                {t("sessions")}
              </Link>
              {canAccessAdminPortal(me) && (
                <Link
                  href="/admin"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                >
                  <Shield className="size-3.5" />
                  Admin Portal
                </Link>
              )}

              <div className="my-1 h-px bg-border" />

              {/* Theme switcher */}
              <div className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2.5 font-medium">
                  {isDark ? (
                    <Moon className="size-3.5 text-blue-400" />
                  ) : (
                    <Sun className="size-3.5 text-amber-500" />
                  )}
                  <span>{t("theme")}</span>
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
                    title={t("lightMode")}
                    aria-label={t("switchToLight")}
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
                    title={t("darkMode")}
                    aria-label={t("switchToDark")}
                  >
                    <Moon className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Language switcher */}
              <div className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2.5 font-medium">
                  <Languages className="size-3.5 text-[#0069D3]" />
                  <span>{t("language")}</span>
                </span>
                <div className="flex items-center gap-0.5 rounded-full bg-[#F1F0F5] dark:bg-zinc-800 p-0.5 border border-black/5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => selectLocale("en")}
                    disabled={isLocalePending}
                    className={`flex h-6 px-2 items-center justify-center rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      activeLocale === "en"
                        ? "bg-white text-[#0069D3] shadow-xs dark:bg-zinc-700 dark:text-blue-200"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="English"
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => selectLocale("vi")}
                    disabled={isLocalePending}
                    className={`flex h-6 px-2 items-center justify-center rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                      activeLocale === "vi"
                        ? "bg-white text-[#0069D3] shadow-xs dark:bg-zinc-700 dark:text-blue-200"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Tiếng Việt"
                  >
                    VI
                  </button>
                </div>
              </div>

              <div className="my-1 h-px bg-border" />

              {otherRoles.map((role) => {
                const isFreelancer = role.name === RoleName.FREELANCER;
                const isExpert = role.name === RoleName.EXPERT;
                const isClient = role.name === RoleName.CLIENT;
                const destination = isFreelancer
                  ? "/freelancer"
                  : isExpert
                    ? "/admin/disputes"
                    : isClient
                      ? "/client/jobs"
                      : "/admin";
                const label = isFreelancer
                  ? t("switchToFreelancer")
                  : isClient
                    ? t("switchToClient")
                    : tNav("switchToRole", {
                        role:
                          role.name === RoleName.ADMIN
                            ? tRole("ADMIN")
                            : role.name === RoleName.EXPERT
                              ? tRole("EXPERT")
                              : role.name,
                      });

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      void switchRole(role.name, destination);
                    }}
                    disabled={isSwitchingRole}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-[#D0E1F8]/40 dark:hover:bg-zinc-800 hover:text-[#0069D3] dark:hover:text-blue-300 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <SwitchCamera className="size-3.5" />
                    {isSwitchingRole ? t("switching") : label}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setProfileOpen(false);
                  void logout();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                <LogOut className="size-3.5" />
                {t("logout")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4">
        {!collapsed && (
          <p className="mb-2 px-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {t("mainMenu")}
          </p>
        )}
        <div className="space-y-1">
          {clientNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
