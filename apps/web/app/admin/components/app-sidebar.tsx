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
  FolderTree,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Scale,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { LogoutButton } from "./logout-button";
import { NavMain, type NavItem } from "./nav-main";

// Cấu hình menu sidebar Admin:
// - Dashboard: trang riêng
// - Users / Roles & Permissions / Forum: các nhóm (collapsible) chứa trang con,
//   tự động mở rộng khi đang ở trang con bên trong nhóm.
// Nhãn hiển thị lấy từ namespace "adminNav" theo titleKey.
const navItems: NavItem[] = [
  {
    titleKey: "dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    titleKey: "disputes",
    href: "/admin/disputes",
    icon: Scale,
  },
  {
    titleKey: "skills",
    href: "/admin/skills",
    icon: Tags,
  },
  {
    titleKey: "jobCategories",
    href: "/admin/job-categories",
    icon: FolderTree,
  },
  {
    titleKey: "banners",
    href: "/admin/banners",
    icon: Megaphone,
  },
  {
    titleKey: "users",
    icon: Users,
    children: [
      { titleKey: "userManagement", href: "/admin/users" },
      {
        titleKey: "identityVerification",
        href: "/admin/identity-verifications",
      },
      { titleKey: "profileReviews", href: "/admin/profile-revisions" },
    ],
  },
  {
    titleKey: "rolesPermissions",
    icon: ShieldCheck,
    children: [
      { titleKey: "roles", href: "/admin/roles" },
      { titleKey: "permissions", href: "/admin/permissions" },
      { titleKey: "assignRole", href: "/admin/assign-role" },
    ],
  },
  {
    titleKey: "forum",
    icon: MessageSquare,
    children: [
      { titleKey: "categories", href: "/admin/categories" },
      { titleKey: "comments", href: "/admin/comments" },
      { titleKey: "moderation", href: "/admin/moderation" },
      { titleKey: "reports", href: "/admin/reports" },
      { titleKey: "posts", href: "/admin/posts" },
      { titleKey: "trash", href: "/admin/trash" },
    ],
  },
];

export function AppSidebar() {
  const t = useTranslations("adminNav");

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
              {t("brand")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {t("brandSubtitle")}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain label={t("menu")} items={navItems} />
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
