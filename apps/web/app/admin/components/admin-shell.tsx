"use client";

import { Separator } from "@repo/ui/components/shadcn/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/components/shadcn/sidebar";
import { useTranslations } from "next-intl";
import { AppSidebar } from "./app-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("adminNav");

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger label={t("toggleSidebar")} />
          <Separator orientation="vertical" className="h-4" />
        </header>
        <div className="p-8 max-w-7xl">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
