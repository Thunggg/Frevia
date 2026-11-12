"use client";

import { useMe } from "@/hooks/use-auth";
import { hasMenuPermission } from "@/lib/admin-access";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@repo/ui/components/shadcn/sidebar";
import type { GetMeResType } from "@shared/types";
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
import { useMemo } from "react";
import { NavMain, type NavItem } from "./nav-main";

// Cấu hình danh mục menu Admin toàn diện.
// Mỗi mục có thể chỉ định `requiredPermissions`: danh sách permission paths hoặc module name
// cần có để hiển thị. Nếu không chỉ định, mục đó mặc định hiển thị cho tất cả role có quyền vào Admin.
const ALL_NAV_ITEMS: NavItem[] = [
  {
    titleKey: "dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    requiredPermissions: ["/api/forums/admin/stats", "FORUMS-ADMIN", "FORUMS"],
  },
  {
    titleKey: "disputes",
    href: "/admin/disputes",
    icon: Scale,
    requiredPermissions: ["/api/admin/disputes", "/api/disputes", "DISPUTES"],
  },
  {
    titleKey: "skills",
    href: "/admin/skills",
    icon: Tags,
    requiredPermissions: ["/api/admin/skills", "SKILLS"],
  },
  {
    titleKey: "jobCategories",
    href: "/admin/job-categories",
    icon: FolderTree,
    requiredPermissions: ["/api/admin/job-categories", "JOB-CATEGORIES"],
  },
  {
    titleKey: "banners",
    href: "/admin/banners",
    icon: Megaphone,
    requiredPermissions: ["/api/admin/banners", "BANNERS"],
  },
  {
    titleKey: "users",
    icon: Users,
    children: [
      {
        titleKey: "userManagement",
        href: "/admin/users",
        requiredPermissions: ["/api/users", "USERS"],
      },
      {
        titleKey: "identityVerification",
        href: "/admin/identity-verifications",
        requiredPermissions: [
          "/api/admin/identity-verifications",
          "IDENTITY-VERIFICATIONS",
        ],
      },
      {
        titleKey: "profileReviews",
        href: "/admin/profile-revisions",
        requiredPermissions: [
          "/api/admin/profile-revisions",
          "PROFILE-REVISIONS",
        ],
      },
    ],
  },
  {
    titleKey: "rolesPermissions",
    icon: ShieldCheck,
    children: [
      {
        titleKey: "roles",
        href: "/admin/roles",
        requiredPermissions: ["/api/roles", "ROLES"],
      },
      {
        titleKey: "permissions",
        href: "/admin/permissions",
        requiredPermissions: ["/api/permissions", "PERMISSIONS"],
      },
      {
        titleKey: "assignRole",
        href: "/admin/assign-role",
        requiredPermissions: [
          "/api/roles/:id/permissions",
          "/api/roles",
          "ROLES",
        ],
      },
    ],
  },
  {
    titleKey: "forum",
    icon: MessageSquare,
    children: [
      {
        titleKey: "categories",
        href: "/admin/categories",
        requiredPermissions: [
          "/api/forums/admin/categories",
          "/api/forums/categories",
          "CATEGORIES",
        ],
      },
      {
        titleKey: "comments",
        href: "/admin/comments",
        requiredPermissions: ["/api/forums/admin/comments", "COMMENTS"],
      },
      {
        titleKey: "moderation",
        href: "/admin/moderation",
        requiredPermissions: [
          "/api/forums/admin/pending-posts",
          "MODERATION",
        ],
      },
      {
        titleKey: "reports",
        href: "/admin/reports",
        requiredPermissions: ["/api/forums/reports", "REPORTS"],
      },
      {
        titleKey: "posts",
        href: "/admin/posts",
        requiredPermissions: ["/api/forums/admin/posts", "POSTS"],
      },
      {
        titleKey: "trash",
        href: "/admin/trash",
        requiredPermissions: ["/api/forums/admin/trash/posts", "TRASH"],
      },
    ],
  },
];

export function AppSidebar({
  initialUser,
}: {
  initialUser?: GetMeResType | null;
}) {
  const t = useTranslations("adminNav");
  const { data: me } = useMe();
  const user = me ?? initialUser;

  // Lọc động danh mục menu theo quyền thực tế của role
  // - Admin (sở hữu '*') -> hiển thị toàn bộ
  // - Expert -> chỉ hiển thị các phần được cấp (Disputes...)
  // - Role mới / CSKH -> chỉ hiển thị chính xác các mục được gán quyền
  // - Nhóm menu không có mục con nào hợp lệ sẽ tự động ẩn hoàn toàn
  const filteredNavItems = useMemo(() => {
    if (!user) {
      return ALL_NAV_ITEMS;
    }

    const userPermissions = user.permissions ?? [];
    const userModules = user.permissionModules ?? [];

    return ALL_NAV_ITEMS.map((item) => {
      // Xử lý nhóm menu có danh sách con (collapsible)
      if (item.children?.length) {
        const visibleChildren = item.children.filter((child) =>
          hasMenuPermission(
            userPermissions,
            userModules,
            child.requiredPermissions,
          ),
        );

        // Nếu cả nhóm không có bất kỳ trang con nào được phân quyền -> ẩn nhóm
        if (visibleChildren.length === 0) {
          return null;
        }

        return {
          ...item,
          children: visibleChildren,
        };
      }

      // Xử lý mục đơn lẻ
      const isVisible = hasMenuPermission(
        userPermissions,
        userModules,
        item.requiredPermissions,
      );

      return isVisible ? item : null;
    }).filter((item): item is NavItem => item !== null);
  }, [user]);

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
        <NavMain label={t("menu")} items={filteredNavItems} />
      </SidebarContent>
    </Sidebar>
  );
}
