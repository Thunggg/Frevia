"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  ChevronDown,
  FileText,
  LogOut,
  Menu,
  Search,
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

export type UserRole = "GUEST" | "CLIENT" | "FREELANCER";

export type HeaderProps = {
  role: UserRole;
};

const roleConfig = {
  CLIENT: {
    name: "Client",
    links: [
      { href: "/post-job", label: "Post a Job" },
      { href: "/my-jobs", label: "My Jobs" },
      { href: "/forum", label: "Forum" },
    ],
  },
  FREELANCER: {
    name: "Freelancer",
    links: [
      { href: "/find-work", label: "Find Work" },
      { href: "/proposals", label: "Proposals" },
      { href: "/forum", label: "Forum" },
    ],
  },
} as const;

function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-bold text-[#4fae2e]">
      <Image src="/Logo.png" alt="Frevia logo" width={28} height={28} className="size-7 object-contain" priority />
      Frevia
    </Link>
  );
}

function HeaderNavigation({ role, mobile = false }: HeaderProps & { mobile?: boolean }) {
  const pathname = usePathname();
  const links = role === "GUEST" ? [] : roleConfig[role].links;

  return (
    <div className={mobile ? "space-y-1" : "hidden items-center gap-6 md:flex"}>
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`block text-sm font-medium transition-colors ${
              isActive ? "text-[#4fae2e] underline decoration-2 underline-offset-4" : "text-gray-700 hover:text-[#4fae2e] dark:text-gray-200"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  useEffect(() => setQuery(searchParams.get("keyword") ?? ""), [searchParams]);

  return (
    <form
      className="hidden max-w-md flex-1 md:block"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        const keyword = query.trim();
        keyword ? params.set("keyword", keyword) : params.delete("keyword");
        params.set("page", "1");
        router.push(`/find-work?${params.toString()}`);
      }}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for projects, skills..."
          className="w-full rounded-full border-0 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 shadow-sm outline-none ring-[#4fae2e]/30 focus:ring-2"
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
        <button className="hidden items-center gap-2 rounded-full outline-none ring-[#4fae2e]/30 focus:ring-2 sm:flex" aria-label="Open profile menu">
          <Avatar><AvatarFallback>{profile.name.slice(0, 1)}</AvatarFallback></Avatar>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{profile.name}</span>
          <ChevronDown className="size-4 text-gray-600 dark:text-gray-300" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="flex items-center gap-3 px-3 py-4">
          <Avatar size="lg"><AvatarFallback>{profile.name.slice(0, 1)}</AvatarFallback></Avatar>
          <div><p className="text-lg font-semibold text-foreground">{profile.name}</p><p className="font-normal text-muted-foreground">{role === "FREELANCER" ? "Freelancer" : "Client"}</p></div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/profile"><UserRound />My Profile</Link></DropdownMenuItem>
        {role === "FREELANCER" && <><DropdownMenuItem asChild><Link href="/proposals"><FileText />My Proposals<span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">2</span></Link></DropdownMenuItem><DropdownMenuItem asChild><Link href="/bookmarks"><Bookmark />My Bookmarks</Link></DropdownMenuItem></>}
        {role === "CLIENT" && <DropdownMenuItem asChild><Link href="/my-jobs"><FileText />My Jobs</Link></DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href={role === "FREELANCER" ? "/client" : "/find-work"}><SwitchCamera />Switch to {role === "FREELANCER" ? "Client" : "Freelancer"}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/settings"><Settings />Settings</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={logout}><LogOut />Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderActions({ role }: HeaderProps) {
  if (role === "GUEST") {
    return <div className="ml-auto flex items-center gap-2"><Button variant="ghost" asChild><Link href="/login">Log in</Link></Button><Button asChild><Link href="/register">Sign up</Link></Button></div>;
  }

  return <div className="ml-auto flex items-center gap-3"><Button variant="ghost" size="icon" className="hidden rounded-full sm:inline-flex" aria-label="Notifications"><Bell className="size-5" /></Button><ProfileDropdown role={role} /></div>;
}

export function Header({ role }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#eaf8df] dark:bg-[#12331f]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />
        {role === "FREELANCER" && <HeaderSearch />}
        <HeaderNavigation role={role} />
        <HeaderActions role={role} />
        <button onClick={() => setIsMenuOpen((open) => !open)} className="rounded-md p-2 hover:bg-black/5 md:hidden" aria-label="Toggle menu">
          {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {isMenuOpen && <div className="space-y-3 border-t border-black/10 bg-[#eaf8df] p-4 md:hidden"><HeaderNavigation role={role} mobile /><div className="border-t border-black/10 pt-3 text-sm font-medium text-muted-foreground">{role === "GUEST" ? "Welcome to Frevia" : roleConfig[role].name}</div></div>}
    </header>
  );
}
