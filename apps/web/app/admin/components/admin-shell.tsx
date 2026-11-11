"use client";

import { Separator } from "@repo/ui/components/shadcn/separator";
import {
  SidebarInset,
  SidebarProvider,
} from "@repo/ui/components/shadcn/sidebar";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { AdminProfileDropdown } from "./admin-profile-dropdown";
import { AppSidebar } from "./app-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <Separator orientation="vertical" className="h-4" />
            <AdminProfileDropdown />
          </div>
        </header>
        <div className="p-8 max-w-7xl">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
