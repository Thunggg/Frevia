"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/shadcn/sidebar";
import {
  ArrowLeft,
  FileText,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Shield,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { NavMain, type NavItem } from "./nav-main";

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Posts",
    href: "/admin/posts",
    icon: FileText,
  },
  {
    title: "Forum",
    icon: MessageSquare,
    children: [
      { title: "Comments", href: "/admin/comments" },
      { title: "Reports", href: "/admin/reports" },
    ],
  },
  {
    title: "Roles",
    href: "/admin/roles",
    icon: UsersRound,
  },
  {
    title: "Permissions",
    href: "/admin/permissions",
    icon: KeyRound,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Shield className="h-4 w-4" />
          <span className="font-semibold">Admin Panel</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain label="Menu" items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/forum">
                <ArrowLeft />
                <span>Back to Forum</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
