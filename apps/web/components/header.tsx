"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  ChevronDown,
  Eye,
  FileText,
  LogOut,
  Heart,
  Link2,
  Menu,
  MessageSquare,
  MonitorSmartphone,
  Search,
  ShieldCheck,
  SwitchCamera,
  UserPlus,
  UserRound,
  UserCheck,
  X,
} from "@/components/icons";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { MessageBell } from "@/components/notification-bell";
import { NotificationsBell } from "@/components/notifications-bell";
import { ContactDialog } from "@/components/contact-dialog";
import { useMe } from "@/hooks/use-auth";
import { authApiRequest } from "@/apiRequests/auth";
import { RoleName } from "@shared/types";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";

export type UserRole = "GUEST" | "CLIENT" | "FREELANCER";

export type HeaderProps = {
  role: UserRole;
};

type NavLink = {
  href: string;
  label: string;
  exact?: boolean;
  excludePaths?: string[];
};

const roleConfig: Record<
  UserRole,
  { name: string; links: NavLink[] }
> = {
  GUEST: {
    name: "Guest",
    links: [
      { href: "/find-work", label: "Find Work" },
      { href: "/client/jobs", label: "Hire Talent" },
      { href: "/forum", label: "Forum" },
    ],
  },
  CLIENT: {
    name: "Client",
    links: [
      {
        href: "/client/jobs",
        label: "My Jobs",
        excludePaths: ["/client/jobs/new"],
      },
      { href: "/forum", label: "Forum" },
    ],
  },
  FREELANCER: {
    name: "Freelancer",
    links: [
      { href: "/freelancer/find-work", label: "Find Work" },
      { href: "/freelancer/bookmarks", label: "Bookmarks" },
      { href: "/freelancer/proposals", label: "My Proposals" },
      { href: "/freelancer/contracts", label: "Contracts" },
      { href: "/freelancer/saved-searches", label: "Saved searches" },
      { href: "/forum", label: "Forum" },
    ],
  },
};

function isNavLinkActive(link: NavLink, pathname: string) {
  if (link.exact) return pathname === link.href;
  const pathMatches =
    pathname === link.href || pathname.startsWith(`${link.href}/`);
  if (!pathMatches) return false;
  if (
    link.excludePaths?.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  )
    return false;
  return true;
}

function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 mr-1 sm:mr-3">
      <span className="text-3xl font-aquire tracking-tight sm:text-4xl">
        frevia
      </span>
    </Link>
  )
}

function HeaderNavigation({
  role,
  mobile = false,
  onNavigate,
}: HeaderProps & { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const links = roleConfig[role]?.links ?? [];

  return (
    <div
      className={mobile ? "space-y-1" : "hidden items-center gap-1 md:flex"}
    >
      {links.map((link) => {
        const isActive = isNavLinkActive(link, pathname);
        return (
          <Link
            key={link.label}
            href={link.href}
            onClick={onNavigate}
            className={`rounded-full text-sm font-medium transition-all duration-150 ${mobile ? "block px-4 py-2" : "px-3.5 py-1.5"
              } ${isActive
                ? "bg-slate-100 text-gray-950 font-semibold dark:bg-zinc-800 dark:text-white"
                : "text-gray-600 hover:bg-black/[0.04] hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              }`}
          >
            {link.label}
          </Link>
        );
      })}
      {role === "GUEST" && (
        <ContactDialog
          triggerClassName={`rounded-full text-sm font-medium transition-all duration-150 ${mobile ? "block w-full text-left px-4 py-2" : "px-3.5 py-1.5"
            } text-gray-600 hover:bg-black/[0.04] hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white`}
        />
      )}
    </div>
  );
}

function HeaderSearch({
  className = "hidden max-w-xs flex-1 md:block lg:max-w-sm",
  role,
}: {
  className?: string;
  role?: UserRole;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setQuery(searchParams.get("keyword") ?? ""), [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        const keyword = query.trim();
        if (keyword) {
          params.set("keyword", keyword);
        } else {
          params.delete("keyword");
        }
        params.set("page", "1");
        const searchBase =
          role === "FREELANCER" ? "/freelancer/find-work" : "/find-work";
        router.push(`${searchBase}?${params.toString()}`);
      }}
    >
      <div className="relative flex items-center">
        <Search
          className="absolute left-3.5 size-4 text-muted-foreground"
          strokeWidth={1.75}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products..."
          className="h-9 w-full rounded-full border border-slate-200/80 dark:border-zinc-700/60 dark:bg-zinc-800/60 dark:text-foreground dark:placeholder:text-zinc-400 dark:focus:bg-zinc-900 focus:ring-blue-500/15 dark:focus:bg-zinc-900 bg-slate-100/70 pl-9.5 pr-14 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:border-green-600 focus:bg-white focus:ring-2"
        />
        <kbd className="pointer-events-none font-semibold bg-slate-100/70 absolute right-2.5 hidden items-center gap-1 rounded-full border border-slate-300/80  px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground dark:border-zinc-700 dark:bg-zinc-900 sm:flex">
          <span className="text-xs">Ctrl K</span>
        </kbd>
      </div>
    </form>
  );
}

function useRoleContextAction(role: Exclude<UserRole, "GUEST">) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isLoading: isMeLoading } = useMe();
  const [isRoleActionPending, setIsRoleActionPending] = useState(false);
  const targetRole =
    role === "FREELANCER" ? RoleName.CLIENT : RoleName.FREELANCER;
  const hasTargetRole =
    me?.roles.some((item) => item.name === targetRole) === true;
  const targetRoleLabel =
    targetRole === RoleName.CLIENT ? "Client" : "Freelancer";

  const updateRoleContext = async () => {
    if (isMeLoading || !me || isRoleActionPending) return false;

    setIsRoleActionPending(true);
    try {
      if (hasTargetRole) {
        await authApiRequest.switchRole({ role: targetRole });
      } else {
        await authApiRequest.joinRole({ role: targetRole });
      }

      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toastSuccess({
        message: hasTargetRole
          ? `Switched to ${targetRoleLabel}`
          : `${targetRoleLabel} role added`,
      });
      router.push(
        targetRole === RoleName.CLIENT ? "/client/jobs" : "/freelancer/find-work",
      );
      router.refresh();
      return true;
    } catch {
      toastError({
        message: hasTargetRole
          ? "Unable to switch role. Please try again."
          : "Unable to add role. Please try again.",
      });
      return false;
    } finally {
      setIsRoleActionPending(false);
    }
  };

  const roleActionLabel = isMeLoading
    ? "Loading roles..."
    : isRoleActionPending
      ? hasTargetRole
        ? "Switching role..."
        : "Adding role..."
      : hasTargetRole
        ? `Switch to ${targetRoleLabel}`
        : `Add ${targetRoleLabel} role`;

  return {
    hasTargetRole,
    isMeLoading,
    isRoleActionPending,
    me,
    roleActionLabel,
    updateRoleContext,
  };
}

function ProfileDropdown({ role }: { role: Exclude<UserRole, "GUEST"> }) {
  const router = useRouter();
  const profile = roleConfig[role];
  const {
    hasTargetRole,
    isMeLoading,
    isRoleActionPending,
    me,
    roleActionLabel,
    updateRoleContext,
  } = useRoleContextAction(role);
  const displayName = me?.profile?.displayName || profile.name;
  const initial = displayName?.charAt(0)?.toUpperCase() ?? "?";
  const publicProfileHref = me?.profile?.id
    ? role === "FREELANCER"
      ? `/profiles/${me.profile.id}`
      : `/clients/${me.id}`
    : null;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="hidden items-center gap-2 rounded-full px-1.5 py-1 outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-[#4fae2e]/30 dark:hover:bg-white/[0.06] sm:flex"
          aria-label="Open profile menu"
        >
          <Avatar className="size-8">
            {me?.profile?.avatarUrl && (
              <AvatarImage src={me.profile.avatarUrl} alt={displayName ?? ""} />
            )}
            <AvatarFallback className="bg-[#4fae2e]/10 text-[11px] font-semibold text-[#4fae2e]">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[100px] truncate text-[13px] font-medium text-foreground/80">
            {displayName}
          </span>
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
              <AvatarImage src={me.profile.avatarUrl} alt={displayName ?? ""} />
            )}
            <AvatarFallback className="bg-[#4fae2e]/10 text-sm font-semibold text-[#4fae2e]">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </p>
            <p className="text-xs text-muted-foreground">
              {role === "FREELANCER" ? "Freelancer" : "Client"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {publicProfileHref ? (
          <DropdownMenuItem asChild>
            <Link href={publicProfileHref} className="cursor-pointer">
              <Eye className="size-4 text-muted-foreground" />
              View public profile
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link
            href={role === "FREELANCER" ? "/freelancer/profile" : "/account-profile"}
            className="cursor-pointer"
          >
            <UserRound className="size-4 text-muted-foreground" />
            Profile settings
          </Link>
        </DropdownMenuItem>
        {role === "FREELANCER" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/freelancer/profile" className="cursor-pointer">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Identity verification
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/freelancer/bookmarks" className="cursor-pointer">
                <Bookmark className="size-4 text-muted-foreground" />
                My Bookmarks
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/freelancer/proposals" className="cursor-pointer">
                <FileText className="size-4 text-muted-foreground" />
                My Proposals
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/freelancer/contracts" className="cursor-pointer">
                <FileText className="size-4 text-muted-foreground" />
                Contracts
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/freelancer/saved-searches" className="cursor-pointer">
                <Search className="size-4 text-muted-foreground" />
                Saved searches
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {role === "CLIENT" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/client/jobs" className="cursor-pointer">
                <FileText className="size-4 text-muted-foreground" />
                My Jobs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/account-profile?tab=favorites"
                className="cursor-pointer"
              >
                <Heart className="size-4 text-muted-foreground" />
                Favorite freelancers
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/account-profile?tab=following"
                className="cursor-pointer"
              >
                <UserCheck className="size-4 text-muted-foreground" />
                Following
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/account-profile" className="cursor-pointer">
            <Link2 className="size-4 text-muted-foreground" />
            Social links
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          disabled={isMeLoading || isRoleActionPending}
          onSelect={(event) => {
            event.preventDefault();
            void updateRoleContext();
          }}
        >
          {hasTargetRole ? (
            <SwitchCamera className="size-4 text-muted-foreground" />
          ) : (
            <UserPlus className="size-4 text-muted-foreground" />
          )}
          {roleActionLabel}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/sessions" className="cursor-pointer">
            <MonitorSmartphone className="size-4 text-muted-foreground" />
            Sessions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={logout}
          className="cursor-pointer"
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderActions({ role }: HeaderProps) {
  if (role === "GUEST") {
    return (
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          asChild
          className="hidden h-8.5 rounded-full bg-green-300 px-4 text-xs sm:text-sm font-semibold text-green-800 shadow-xs hover:bg-green-400 sm:inline-flex dark:bg-green-500 dark:hover:bg-green-700"
        >
          <Link href="/register">Register</Link>
        </Button>
        <Button
          variant="ghost"
          asChild
          className="hidden h-8.5 rounded-full px-3 text-xs sm:text-sm font-medium text-foreground/80 hover:bg-black/[0.04] hover:text-foreground sm:inline-flex dark:hover:bg-white/[0.06]"
        >
          <Link href="/login">Login</Link>
        </Button>
        <div className="hidden h-4 w-px bg-border/70 sm:block" />
        <ThemeToggle />
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
      <ContactDialog />
      <MessageBell />
      <NotificationsBell />
      <ThemeToggle />
      <ProfileDropdown role={role} />
    </div>
  );
}

function MobileProfileNavigation({
  role,
  onNavigate,
}: {
  role: Exclude<UserRole, "GUEST">;
  onNavigate: () => void;
}) {
  const {
    hasTargetRole,
    isMeLoading,
    isRoleActionPending,
    me,
    roleActionLabel,
    updateRoleContext,
  } = useRoleContextAction(role);
  const publicProfileHref = me?.profile?.id
    ? role === "FREELANCER"
      ? `/profiles/${me.profile.id}`
      : `/clients/${me.id}`
    : null;

  return (
    <div className="space-y-1">
      {publicProfileHref ? (
        <Link
          href={publicProfileHref}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground/70 transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]"
        >
          <Eye className="size-4 text-muted-foreground" />
          View public profile
        </Link>
      ) : null}
      <Link
        href={role === "FREELANCER" ? "/freelancer/profile" : "/account-profile"}
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground/70 transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]"
      >
        <UserRound className="size-4 text-muted-foreground" />
        Profile settings
      </Link>
      <button
        type="button"
        disabled={isMeLoading || isRoleActionPending}
        onClick={() => {
          void updateRoleContext().then((didUpdate) => {
            if (didUpdate) onNavigate();
          });
        }}
        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-foreground/70 transition-colors hover:bg-black/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4fae2e]/30 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/[0.06]"
      >
        {hasTargetRole ? (
          <SwitchCamera className="size-4 text-muted-foreground" />
        ) : (
          <UserPlus className="size-4 text-muted-foreground" />
        )}
        {roleActionLabel}
      </button>
    </div>
  );
}

export function Header({ role }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:border-white/[0.08] dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <Logo />
          <HeaderNavigation role={role} />
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          {(role === "FREELANCER" || role === "GUEST") && (
            <HeaderSearch
              role={role}
              className="hidden max-w-xs flex-1 md:block lg:max-w-sm"
            />
          )}
          <HeaderActions role={role} />
          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-black/[0.04] hover:text-foreground md:hidden dark:hover:bg-white/[0.06]"
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="space-y-3 border-t border-border/50 bg-white/98 p-4 backdrop-blur-xl shadow-xl md:hidden dark:border-white/[0.08] dark:bg-zinc-950/98">
          {(role === "FREELANCER" || role === "GUEST") && (
            <HeaderSearch role={role} className="block w-full" />
          )}
          <HeaderNavigation role={role} mobile onNavigate={closeMenu} />
          {role === "GUEST" ? (
            <div className="flex flex-col gap-2 border-t border-border/50 pt-3 dark:border-white/[0.08]">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <Button
                variant="outline"
                asChild
                className="h-9 w-full rounded-full border-border/60 bg-transparent text-sm font-medium dark:border-white/10"
              >
                <Link href="/login" onClick={closeMenu}>
                  Login
                </Link>
              </Button>
              <Button
                asChild
                className="h-9 w-full rounded-full bg-blue-600 text-sm font-semibold text-white shadow-xs hover:bg-blue-700"
              >
                <Link href="/register" onClick={closeMenu}>
                  Register
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-1 border-t border-border/50 pt-3 dark:border-white/[0.08]">
              <Link
                href={
                  role === "FREELANCER"
                    ? "/freelancer/conversations"
                    : role === "CLIENT"
                      ? "/client/conversations"
                      : "/conversations"
                }
                onClick={closeMenu}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground/60 transition-colors hover:bg-black/[0.04] hover:text-foreground dark:text-foreground/65 dark:hover:bg-white/[0.06]"
              >
                <MessageSquare className="size-4 text-muted-foreground" />
                Conversations
              </Link>
              <MobileProfileNavigation role={role} onNavigate={closeMenu} />
              <div className="px-3 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                {roleConfig[role].name}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

