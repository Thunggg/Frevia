"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/shadcn/button";
import { Bell, Lightbulb, LogOut, UserRound } from "@/components/icons";

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
    <div className="min-h-dvh bg-muted/20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-5">
            <Link
              href="/expert/consultations"
              className="shrink-0 text-xl font-semibold tracking-tight sm:text-2xl"
            >
              Frevia{" "}
              <span className="hidden text-[#4fae2e] sm:inline">
                {tRole("EXPERT")}
              </span>
            </Link>
            <Link
              href="/expert/consultations"
              aria-label={t("consultations")}
              aria-current={
                pathname.startsWith("/expert/consultations")
                  ? "page"
                  : undefined
              }
              className={`flex items-center gap-2 rounded-md p-2 text-sm font-medium ${
                pathname.startsWith("/expert/consultations")
                  ? "bg-[#eaf8df] text-[#377d25] dark:bg-[#4fae2e]/15 dark:text-[#8ee36f]"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Lightbulb className="size-4" />
              <span className="hidden lg:inline">{t("consultations")}</span>
            </Link>
            <Link
              href="/expert/profile"
              aria-label={t("profile")}
              aria-current={
                pathname.startsWith("/expert/profile") ? "page" : undefined
              }
              className={`flex items-center gap-2 rounded-md p-2 text-sm font-medium ${
                pathname.startsWith("/expert/profile")
                  ? "bg-[#eaf8df] text-[#377d25] dark:bg-[#4fae2e]/15 dark:text-[#8ee36f]"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <UserRound className="size-4" />
              <span className="hidden lg:inline">{t("profile")}</span>
            </Link>
            <Link
              href="/expert/notifications"
              aria-label={t("notifications")}
              aria-current={
                pathname.startsWith("/expert/notifications")
                  ? "page"
                  : undefined
              }
              className={`flex items-center gap-2 rounded-md p-2 text-sm font-medium ${
                pathname.startsWith("/expert/notifications")
                  ? "bg-[#eaf8df] text-[#377d25] dark:bg-[#4fae2e]/15 dark:text-[#8ee36f]"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Bell className="size-4" />
              <span className="hidden lg:inline">{t("notifications")}</span>
            </Link>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("logout")}
            onClick={() => void logout()}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">{t("logout")}</span>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
