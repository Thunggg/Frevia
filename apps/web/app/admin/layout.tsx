import { redirect } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { getMeServer } from "@/lib/get-me";
import { RoleName } from "@shared/types";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Flag,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { LogoutButton } from "./components/logout-button";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Posts",
    href: "/admin/posts",
    icon: FileText,
  },
  {
    label: "Comments",
    href: "/admin/comments",
    icon: MessageSquare,
  },
  {
    label: "Reports",
    href: "/admin/reports",
    icon: Flag,
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getMeServer();

  if (!user) {
    redirect("/forum");
  }

  const isAdmin = user.roles.some((r) => r.name === RoleName.ADMIN);
  if (!isAdmin) {
    redirect("/forum");
  }

  const pathname = (await headers()).get("x-nextjs-url") ?? "";

  const isActive = (href: string) => {
    if (href === "/admin")
      return pathname === "/admin" || pathname === "/admin/";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 sticky top-0 h-screen border-r bg-card flex flex-col z-10">
        <div className="p-5 border-b">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              Admin Panel
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-1">
          <LogoutButton />
          <Link
            href="/forum"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Forum
          </Link>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="p-8 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
