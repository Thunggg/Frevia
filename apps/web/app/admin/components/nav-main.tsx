"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@repo/ui/components/shadcn/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@repo/ui/components/shadcn/sidebar";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  /** Khoá dịch trong namespace "adminNav" */
  titleKey: string;
  href?: string;
  icon?: LucideIcon;
  children?: { titleKey: string; href: string }[];
};

export function NavMain({
  label,
  items,
}: {
  label?: string;
  items: NavItem[];
}) {
  const pathname = usePathname();
  const t = useTranslations("adminNav");

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <SidebarGroup>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {items.map((item) => {
          if (item.children?.length) {
            const childActive = item.children.some((child) =>
              isActive(child.href),
            );

            return (
              <Collapsible
                key={item.titleKey}
                asChild
                defaultOpen={childActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={t(item.titleKey)}
                      isActive={childActive}
                    >
                      {item.icon ? <item.icon /> : null}
                      <span>{t(item.titleKey)}</span>
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.children.map((child) => (
                        <SidebarMenuSubItem key={child.href}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(child.href)}
                          >
                            <Link href={child.href}>{t(child.titleKey)}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.titleKey}>
              <SidebarMenuButton
                asChild
                tooltip={t(item.titleKey)}
                isActive={isActive(item.href)}
              >
                <Link href={item.href ?? "#"}>
                  {item.icon ? <item.icon /> : null}
                  <span>{t(item.titleKey)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
