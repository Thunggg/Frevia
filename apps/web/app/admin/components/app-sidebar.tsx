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
  IdCard,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Shield,
  UserCog,
  UsersRound,
} from "lucide-react";
import { NavMain, type NavItem } from "./nav-main";
import { LogoutButton } from "./logout-button";

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Forum",
    icon: MessageSquare,
    children: [
      { title: "Comments", href: "/admin/comments" },
      { title: "Moderation", href: "/admin/moderation" },
      { title: "Reports", href: "/admin/reports" },
      { title: "Posts", href: "/admin/posts" },
      { title: "Trash", href: "/admin/trash" },
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
  {
    title: "ID Verification",
    href: "/admin/identity-verifications",
    icon: IdCard,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
            <Shield className="size-4" />
          </div>
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
          {/* <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/forum">
                <ArrowLeft />
                <span>Back to Forum</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem> */}
          <SidebarMenuItem>
            <LogoutButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
