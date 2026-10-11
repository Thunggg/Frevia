"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bookmark,
  ChevronDown,
  FileText,
  LogOut,
  Heart,
  Link2,
  Menu,
  MonitorSmartphone,
  Search,
  ShieldCheck,
  SwitchCamera,
  UserRound,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@repo/ui/components/shadcn/avatar";
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

export type UserRole = "GUEST" | "CLIENT" | "FREELANCER";

export type HeaderProps = {
  role: UserRole;
};

type NavLink = {
  href: string;
  label: string;
  /** Exact pathname match only (e.g. /projects/new). */
  exact?: boolean;
  /** Paths under matchPath that should not activate this link. */
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
      { href: "/forum", label: "Forum" },
    ],
  },
};

function isNavLinkActive(link: NavLink, pathname: string) {
  if (link.exact) {
    return pathname === link.href;
  }

  const pathMatches =
    pathname === link.href || pathname.startsWith(`${link.href}/`);

  if (!pathMatches) return false;

  if (
    link.excludePaths?.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return false;
  }

  return true;
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2 text-xl font-bold text-[#4fae2e]"
    >
      <Image
        src="/Logo.png"
        alt="Frevia logo"
        width={28}
        height={28}
        className="size-7 object-contain"
        priority
      />
      Frevia
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
    <div className={mobile ? "space-y-1" : "hidden items-center gap-6 md:flex"}>
      {links.map((link) => {
        const isActive = isNavLinkActive(link, pathname);
        return (
          <Link
            key={link.label}
            href={link.href}
            onClick={onNavigate}
            className={`block rounded-md text-sm font-medium transition-colors ${
              mobile ? "px-2 py-2" : ""
            } ${
              isActive
                ? "text-[#4fae2e] underline decoration-2 underline-offset-4"
                : "text-foreground/75 hover:text-[#4fae2e] dark:text-foreground/85 dark:hover:text-[#5bc03a]"
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
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for projects, skills..."
          className="w-full rounded-full border border-transparent bg-white py-2 pl-10 pr-4 text-sm text-foreground shadow-sm outline-none ring-[#4fae2e]/30 placeholder:text-muted-foreground focus:ring-2 dark:border-white/10 dark:bg-muted dark:text-foreground dark:shadow-none dark:ring-[#4fae2e]/40"
        />
      </div>
    </form>
  );
}

function ProfileDropdown({ role }: HeaderProps) {
  const router = useRouter();
  const profile = roleConfig[role as Exclude<UserRole, "GUEST">];

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="hidden items-center gap-2 rounded-full outline-none ring-[#4fae2e]/30 focus:ring-2 sm:flex"
          aria-label="Open profile menu"
        >
          <Avatar>
            <AvatarFallback>{profile.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">
            {profile.name}
          </span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="flex items-center gap-3 px-3 py-4">
          <Avatar size="lg">
            <AvatarFallback>{profile.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {profile.name}
            </p>
            <p className="font-normal text-muted-foreground">
              {role === "FREELANCER" ? "Freelancer" : "Client"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account-profile">
            <UserRound />
            Profile settings
          </Link>
        </DropdownMenuItem>
        {role === "FREELANCER" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/account-profile">
                <ShieldCheck />
                Identity verification
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/bookmarks">
                <Bookmark />
                My Bookmarks
              </Link>
            </DropdownMenuItem>
          </>
        )}
        {role === "CLIENT" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/projects">
                <FileText />
                My Jobs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/account-profile">
                <Heart />
                Favorite freelancers
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem asChild>
          <Link href="/account-profile">
            <Link2 />
            Social links
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={role === "FREELANCER" ? "/client" : "/find-work"}>
            <SwitchCamera />
            Switch to {role === "FREELANCER" ? "Client" : "Freelancer"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/sessions">
            <MonitorSmartphone />
            Sessions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={logout}>
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderActions({ role }: HeaderProps) {
  if (role === "GUEST") {
    return (
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          asChild
          className="hidden text-foreground hover:bg-black/5 hover:text-foreground sm:inline-flex dark:hover:bg-white/10"
        >
          <Link href="/login">Log in</Link>
        </Button>
        <Button
          asChild
          className="hidden bg-[#4fae2e] text-white hover:bg-[#459928] sm:inline-flex dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
        >
          <Link href="/register">Get started</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-1 sm:gap-3">
      <ThemeToggle />
      <ProfileDropdown role={role} />
    </div>
  );
}

export function Header({ role }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#4fae2e]/15 bg-[#eaf8df] text-foreground dark:border-white/10 dark:bg-[#161716]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />
        {role === "FREELANCER" && <HeaderSearch />}
        <HeaderNavigation role={role} />
        <HeaderActions role={role} />
        <button
          onClick={() => setIsMenuOpen((open) => !open)}
          className="rounded-md p-2 text-foreground hover:bg-black/5 md:hidden dark:hover:bg-white/10"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {isMenuOpen && (
        <div className="space-y-3 border-t border-[#4fae2e]/15 bg-[#eaf8df] p-4 md:hidden dark:border-white/10 dark:bg-[#161716]">
          {role === "FREELANCER" && (
            <HeaderSearch className="block w-full" />
          )}
          <HeaderNavigation role={role} mobile onNavigate={closeMenu} />
          {role === "GUEST" ? (
            <div className="flex flex-col gap-2 border-t border-[#4fae2e]/15 pt-3 dark:border-[#4fae2e]/25">
              <Button
                variant="outline"
                asChild
                className="w-full border-[#4fae2e]/35 bg-transparent dark:border-[#4fae2e]/40 dark:hover:bg-[#4fae2e]/15"
              >
                <Link href="/login" onClick={closeMenu}>
                  Log in
                </Link>
              </Button>
              <Button
                asChild
                className="w-full bg-[#4fae2e] text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
              >
                <Link href="/register" onClick={closeMenu}>
                  Get started
                </Link>
              </Button>
            </div>
          ) : (
            <div className="border-t border-[#4fae2e]/15 pt-3 text-sm font-medium text-muted-foreground dark:border-[#4fae2e]/25">
              {roleConfig[role].name}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
