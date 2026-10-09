"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui/components/shadcn/sidebar";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { AppSidebar } from "./components/app-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground">Admin</span>
        </header>
        <div className="p-8 max-w-7xl">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
