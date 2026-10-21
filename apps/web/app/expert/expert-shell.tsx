"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/shadcn/button";
import { LogOut, UserRound } from "lucide-react";

export function ExpertShell({ children }: { children: React.ReactNode }) {
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
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-7">
            <Link
              href="/expert/profile"
              className="text-2xl font-semibold tracking-tight"
            >
              Frevia <span className="text-[#4fae2e]">Expert</span>
            </Link>
            <Link
              href="/expert/profile"
              className={`flex items-center gap-2 text-sm font-medium ${
                pathname.startsWith("/expert/profile")
                  ? "text-[#4fae2e]"
                  : "text-muted-foreground"
              }`}
            >
              <UserRound className="size-4" />
              Profile
            </Link>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            <LogOut className="size-4" />
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
