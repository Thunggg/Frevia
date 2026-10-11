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
  UserCog,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
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
  {
    title: "Assign Role",
    href: "/admin/assign-role",
    icon: UserCog,
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
              Forum tools
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
