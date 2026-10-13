"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
  UserRound,
  UserCheck,
  X,
} from "lucide-react";

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
import { toastError } from "@repo/ui/components/shadcn/toast";

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
  Exclude<UserRole, "GUEST">,
  { name: string; links: NavLink[] }
> = {
  CLIENT: {
    name: "Client",
    links: [
      {
        href: "/projects",
        label: "My Jobs",
        excludePaths: ["/projects/new"],
      },
      { href: "/forum", label: "Forum" },
    ],
  },
  FREELANCER: {
    name: "Freelancer",
    links: [
      { href: "/find-work", label: "Find Work" },
      { href: "/bookmarks", label: "Bookmarks" },
      { href: "/saved-searches", label: "Saved searches" },
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
    <Link href="/" className="flex shrink-0 items-center gap-2.5">
      <Image
        src="/frevia-mark.png"
        alt="Frevia logo"
        width={26}
        height={26}
        className="size-[26px] object-contain"
        priority
      />
      <span className="text-lg font-bold tracking-tight text-[#4fae2e]">
        Frevia
      </span>
    </Link>
  );
}

function HeaderNavigation({
  role,
  mobile = false,
  onNavigate,
}: HeaderProps & { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const links = role === "GUEST" ? [] : roleConfig[role].links;

  return (
    <div
      className={mobile ? "space-y-0.5" : "hidden items-center gap-1 md:flex"}
    >
      {links.map((link) => {
        const isActive = isNavLinkActive(link, pathname);
        return (
          <Link
            key={link.label}
            href={link.href}
            onClick={onNavigate}
            className={`rounded-lg text-[13px] font-medium transition-all duration-150 ${
              mobile ? "block px-3 py-2" : "px-3 py-1.5"
            } ${
              isActive
                ? "bg-[#4fae2e]/10 text-[#4fae2e] dark:bg-[#4fae2e]/15"
                : "text-foreground/60 hover:bg-black/[0.04] hover:text-foreground dark:text-foreground/65 dark:hover:bg-white/[0.06] dark:hover:text-foreground/90"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

function HeaderSearch({
  className = "hidden max-w-md flex-1 md:block",
}: {
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => setQuery(searchParams.get("keyword") ?? ""), [searchParams]);

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
        router.push(`/find-work?${params.toString()}`);
      }}
    >
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.75}
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for projects, skills..."
          className="h-9 w-full rounded-lg border border-border/60 bg-white/60 pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/60 transition-colors focus:border-[#4fae2e]/50 focus:bg-white focus:ring-1 focus:ring-[#4fae2e]/20 dark:border-white/8 dark:bg-white/[0.03] dark:text-foreground dark:placeholder:text-white/30 dark:focus:border-[#4fae2e]/40 dark:focus:bg-white/[0.06] dark:focus:ring-[#4fae2e]/15"
        />
      </div>
    </form>
  );
}

function ProfileDropdown({ role }: HeaderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const profile = roleConfig[role as Exclude<UserRole, "GUEST">];
  const { data: me, isLoading: isMeLoading } = useMe();
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const displayName = me?.profile?.displayName || profile.name;
  const initial = displayName?.charAt(0)?.toUpperCase() ?? "?";
  const targetRole =
    role === "FREELANCER" ? RoleName.CLIENT : RoleName.FREELANCER;
  const canSwitchRole = me?.roles.some((item) => item.name === targetRole);
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

  const switchRole = async () => {
    if (!canSwitchRole || isSwitchingRole) return;
    setIsSwitchingRole(true);
    try {
      await authApiRequest.switchRole({ role: targetRole });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.push(targetRole === RoleName.CLIENT ? "/projects" : "/find-work");
      router.refresh();
    } catch {
      toastError({ message: "Unable to switch role. Please try again." });
      setIsSwitchingRole(false);
    }
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
          <Link href="/account-profile" className="cursor-pointer">
            <UserRound className="size-4 text-muted-foreground" />
            Profile settings
          </Link>
        </DropdownMenuItem>
        {role === "FREELANCER" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/account-profile" className="cursor-pointer">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Identity verification
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/bookmarks" className="cursor-pointer">
                <Bookmark className="size-4 text-muted-foreground" />
                My Bookmarks
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/saved-searches" className="cursor-pointer">
                <Search className="size-4 text-muted-foreground" />
                Saved searches
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {role === "CLIENT" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/projects" className="cursor-pointer">
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
          disabled={isMeLoading || !canSwitchRole || isSwitchingRole}
          onSelect={(event) => {
            event.preventDefault();
            void switchRole();
          }}
        >
          <SwitchCamera className="size-4 text-muted-foreground" />
          {isMeLoading
            ? "Loading roles..."
            : isSwitchingRole
              ? "Switching role..."
              : canSwitchRole
                ? `Switch to ${role === "FREELANCER" ? "Client" : "Freelancer"}`
                : "Second role not available"}
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
      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <ContactDialog />
        <ThemeToggle />
        <Button
          variant="ghost"
          asChild
          className="hidden h-8 px-3 text-[13px] font-medium text-foreground/70 hover:text-foreground sm:inline-flex"
        >
          <Link href="/login">Log in</Link>
        </Button>
        <Button
          asChild
          className="hidden h-8 rounded-lg bg-[#4fae2e] px-4 text-[13px] font-semibold text-white shadow-sm shadow-[#4fae2e]/20 hover:bg-[#459928] hover:shadow-md hover:shadow-[#4fae2e]/25 sm:inline-flex dark:hover:bg-[#5bc03a]"
        >
          <Link href="/register">Get started</Link>
        </Button>
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
}: HeaderProps & { onNavigate: () => void }) {
  const { data: me } = useMe();
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
        href="/account-profile"
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-foreground/70 transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]"
      >
        <UserRound className="size-4 text-muted-foreground" />
        Profile settings
      </Link>
    </div>
  );
}

export function Header({ role }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-[#eaf8df]/80 backdrop-blur-xl text-foreground dark:border-white/[0.06] dark:bg-[#161716]/80">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <Logo />
        {role === "FREELANCER" && <HeaderSearch />}
        <HeaderNavigation role={role} />
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
      {isMenuOpen && (
        <div className="space-y-2 border-t border-border/40 bg-[#eaf8df]/95 p-4 backdrop-blur-xl md:hidden dark:border-white/[0.06] dark:bg-[#161716]/95">
          {role === "FREELANCER" && <HeaderSearch className="block w-full" />}
          <HeaderNavigation role={role} mobile onNavigate={closeMenu} />
          {role === "GUEST" ? (
            <div className="flex flex-col gap-2 border-t border-border/40 pt-3 dark:border-white/[0.06]">
              <ContactDialog />
              <Button
                variant="outline"
                asChild
                className="h-9 w-full border-border/60 bg-transparent text-[13px] font-medium dark:border-white/10"
              >
                <Link href="/login" onClick={closeMenu}>
                  Log in
                </Link>
              </Button>
              <Button
                asChild
                className="h-9 w-full rounded-lg bg-[#4fae2e] text-[13px] font-semibold text-white shadow-sm shadow-[#4fae2e]/20 hover:bg-[#459928] dark:hover:bg-[#5bc03a]"
              >
                <Link href="/register" onClick={closeMenu}>
                  Get started
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-1 border-t border-border/40 pt-3 dark:border-white/[0.06]">
              <Link
                href="/conversations"
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
