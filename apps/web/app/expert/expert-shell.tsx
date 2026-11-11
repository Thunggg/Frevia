"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/shadcn/button";
import { LogOut, UserRound, Scale } from "lucide-react";

export function ExpertShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("expertShell");
  const tRole = useTranslations("roleName");
  const pathname = usePathname();
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside className="flex w-16 shrink-0 flex-col border-r border-border bg-[#F6F5F9] dark:bg-zinc-950 sm:w-64">
        <div className="flex h-16 items-center border-b px-3 sm:px-5">
          <Link
            href="/expert/disputes"
            className="truncate text-xl font-semibold tracking-tight sm:text-2xl"
          >
            <span className="sm:hidden">F</span>
            <span className="hidden sm:inline">Frevia</span>
          </Link>
        </div>
        <p className="hidden px-5 pb-2 pt-6 text-xs font-medium uppercase tracking-widest text-muted-foreground sm:block">
          {tRole("EXPERT")}
        </p>
        <nav
          className="flex-1 space-y-1 p-2 sm:p-3"
          aria-label={tRole("EXPERT")}
        >
          <Link
            href="/expert/disputes"
            title={t("disputes")}
            aria-current={
              pathname.startsWith("/expert/disputes") ? "page" : undefined
            }
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${pathname.startsWith("/expert/disputes") ? "bg-[#0069D3]/15 text-[#0069D3] dark:text-blue-200" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Scale className="size-4 shrink-0" />
            <span className="hidden sm:inline">{t("disputes")}</span>
          </Link>
          <Link
            href="/expert/profile?edit=1"
            title={t("profile")}
            aria-current={
              pathname.startsWith("/expert/profile") ? "page" : undefined
            }
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
              pathname.startsWith("/expert/profile")
                ? "bg-[#0069D3]/15 text-[#0069D3] dark:text-blue-200"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <UserRound className="size-4 shrink-0" />
            <span className="hidden sm:inline">{t("profile")}</span>
          </Link>
        </nav>
        <div className="border-t p-2 sm:p-3">
          <Button
            variant="ghost"
            className="w-full justify-start"
            title={t("logout")}
            size="sm"
            onClick={() => void logout()}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">{t("logout")}</span>
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
