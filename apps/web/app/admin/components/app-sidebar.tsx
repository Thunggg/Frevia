"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@repo/ui/components/shadcn/sidebar";
import {
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import Image from "next/image";
import { LogoutButton } from "./logout-button";
import { NavMain, type NavItem } from "./nav-main";

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    icon: Users,
    children: [
      { title: "User Management", href: "/admin/users" },
      { title: "Identity Verification", href: "/admin/identity-verifications" },
    ],
  },
  {
    title: "Roles & Permissions",
    icon: ShieldCheck,
    children: [
      { title: "Roles", href: "/admin/roles" },
      { title: "Permissions", href: "/admin/permissions" },
      { title: "Assign Role", href: "/admin/assign-role" },
    ],
  },
  {
    title: "Forum",
    icon: MessageSquare,
    children: [
      { title: "Categories", href: "/admin/categories" },
      { title: "Comments", href: "/admin/comments" },
      { title: "Moderation", href: "/admin/moderation" },
      { title: "Reports", href: "/admin/reports" },
      { title: "Posts", href: "/admin/posts" },
      { title: "Trash", href: "/admin/trash" },
    ],
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Image
            src="/frevia-mark.png"
            alt=""
            width={32}
            height={32}
            className="size-8 object-contain"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-[#4fae2e]">
              Frevia Admin
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Admin tools
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain label="Menu" items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <LogoutButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
