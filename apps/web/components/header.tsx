"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Menu, X } from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMe } from "@/hooks/use-auth";

export type UserRole = "GUEST" | "CLIENT" | "FREELANCER" | "STAFF";

export type HeaderProps = {
  role: UserRole;
};

type NavLinkKey =
  | "findWork"
  | "viewProfileFreelancer"
  | "forum"
  | "policy";

type NavLink = {
  href: string;
  labelKey: NavLinkKey;
  exact?: boolean;
};

const guestLinks: NavLink[] = [
  { href: "/find-work", labelKey: "findWork" },
  { href: "/profiles", labelKey: "viewProfileFreelancer" },
  { href: "/forum", labelKey: "forum" },
  { href: "/privacy-policy", labelKey: "policy" },
];

function isNavLinkActive(link: NavLink, pathname: string) {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2 mr-1 sm:mr-3">
      <span className="text-3xl font-aquire tracking-tight sm:text-4xl">
        frevia
      </span>
    </Link>
  );
}

function HeaderNavigation({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div className={mobile ? "space-y-1" : "hidden items-center gap-1 md:flex"}>
      {guestLinks.map((link) => {
        const isActive = isNavLinkActive(link, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`rounded-full text-sm font-medium transition-all duration-150 ${mobile ? "block px-4 py-2" : "px-3.5 py-1.5"
              } ${isActive
                ? "bg-slate-100 text-gray-950 font-semibold dark:bg-zinc-800 dark:text-white"
                : "text-gray-600 hover:bg-black/[0.04] hover:text-gray-950 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              }`}
          >
            {t(`links.${link.labelKey}`)}
          </Link>
        );
      })}
    </div>
  );
}

export function Header({ role }: HeaderProps) {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const { data: me } = useMe();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  // Header CHỈ dành cho khách (Guest). Các role đã đăng nhập (freelancer, client, admin) không hiển thị header này.
  if (role !== "GUEST" || Boolean(me)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.02)] dark:border-white/[0.08] dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-6">
          <Logo href="/" />
          <HeaderNavigation />
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 md:flex">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              variant="ghost"
              asChild
              className="rounded-full text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              <Link href="/login">{t("login")}</Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-zinc-950 hover:bg-zinc-800 text-white text-sm font-semibold dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 px-5 shadow-xs"
            >
              <Link href="/register">{t("register")}</Link>
            </Button>
          </div>

          <button
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-black/[0.04] hover:text-foreground md:hidden dark:hover:bg-white/[0.06]"
            aria-label={t("toggleMenu")}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="space-y-3 border-t border-border/50 bg-white/98 p-4 backdrop-blur-xl shadow-xl md:hidden dark:border-white/[0.08] dark:bg-zinc-950/98">
          <HeaderNavigation mobile onNavigate={closeMenu} />
          <div className="flex flex-col gap-2 border-t border-border/50 pt-3 dark:border-white/[0.08]">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-muted-foreground">
                {tCommon("theme")}
              </span>
              <div className="flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
            </div>
            <Button
              variant="outline"
              asChild
              className="h-9 w-full rounded-full border-border/60 bg-transparent text-sm font-medium dark:border-white/10"
            >
              <Link href="/login" onClick={closeMenu}>
                {t("login")}
              </Link>
            </Button>
            <Button
              asChild
              className="h-9 w-full rounded-full bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 text-sm font-semibold shadow-xs"
            >
              <Link href="/register" onClick={closeMenu}>
                {t("register")}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
