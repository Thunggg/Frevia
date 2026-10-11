"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bookmark,
  FileText,
  LogOut,
  Menu,
  MessageSquare,
  MessagesSquare,
  Settings,
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

import { useConversations } from "@/hooks/use-conversation";

export type UserRole = "GUEST" | "CLIENT" | "FREELANCER";

export type HeaderProps = {
  role: UserRole;
};

const roleConfig = {
  CLIENT: {
    name: "Client",
  },
  FREELANCER: {
    name: "Freelancer",
  },
} as const;

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/find-work", label: "Jobs" },
  { href: "#", label: "Contact" },
] as const;

const iconLinks = [
  { href: "/forum", label: "Forum", icon: MessagesSquare },
  { href: "/conversations", label: "Messages", icon: MessageSquare },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "#") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2">
      <Image
        src="/Logo.png"
        alt="Frevia"
        width={28}
        height={28}
        className="size-7 object-contain"
        priority
      />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Frevia
      </span>
    </Link>
  );
}

function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {navLinks.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            isActive(pathname, link.href)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function IconNav({
  showLabels = false,
  unreadCount = 0,
  onNavigate,
}: {
  showLabels?: boolean;
  unreadCount?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  if (showLabels) {
    return (
      <div className="space-y-1">
        {iconLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive(pathname, href)
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="relative">
              <Icon className="h-4.5 w-4.5" />
              {href === "/conversations" && unreadCount > 0 && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold tabular-nums text-white ring-2 ring-background">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            {label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1">
      {iconLinks.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          title={label}
          className={`relative flex size-9 items-center justify-center rounded-md transition-colors ${
            isActive(pathname, href)
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
          {href === "/conversations" && unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold tabular-nums text-white ring-2 ring-background">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

function ProfileDropdown({ role }: HeaderProps) {
  const router = useRouter();
  const profileName = role === "GUEST" ? "Guest" : roleConfig[role].name;

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-md p-1 pr-1.5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          aria-label="Open profile menu"
        >
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">
              {profileName.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <UserRound className="hidden size-4 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="flex items-center gap-3 px-3 py-4">
          <Avatar size="lg">
            <AvatarFallback>{profileName.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {profileName}
            </p>
            <p className="font-normal text-muted-foreground">
              {role === "GUEST" ? "Welcome to Frevia" : roleConfig[role].name}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound />
            My Profile
          </Link>
        </DropdownMenuItem>
        {role === "FREELANCER" && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/proposals">
                <FileText />
                My Proposals
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
          <DropdownMenuItem asChild>
            <Link href="/projects">
              <FileText />
              My Jobs
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        {role !== "GUEST" && (
          <>
            <DropdownMenuItem asChild>
              <Link href={role === "FREELANCER" ? "/client" : "/find-work"}>
                <SwitchCamera />
                Switch to {role === "FREELANCER" ? "Client" : "Freelancer"}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={logout}>
              <LogOut />
              Logout
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GuestActions() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <Button variant="ghost" asChild>
        <Link href="/login">Log in</Link>
      </Button>
      <Button asChild>
        <Link href="/register">Sign up</Link>
      </Button>
    </div>
  );
}

export function Header({ role }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const { data: conversations } = useConversations({
    enabled: role !== "GUEST",
  });
  const unreadCount = (conversations ?? []).reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Logo />

        <DesktopNav />
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {role !== "GUEST" && (
            <div className="hidden md:block">
              <IconNav unreadCount={unreadCount} />
            </div>
          )}
          <div className="hidden h-6 w-px bg-border sm:block" />
          {role === "GUEST" ? <GuestActions /> : <ProfileDropdown role={role} />}
          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t p-4 md:hidden">
          <nav className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(pathname, link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {role !== "GUEST" && (
            <div className="mt-3 border-t pt-3">
              <IconNav
                showLabels
                unreadCount={unreadCount}
                onNavigate={() => setIsMenuOpen(false)}
              />
            </div>
          )}
        </div>
      )}
    </header>
  );
}
