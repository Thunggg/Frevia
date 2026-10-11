import {
  FileText,
  MessageSquare,
  Flag,
  Users,
  FolderOpen,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import adminServerRequest from "@/apiRequests/admin.server";
import { Badge } from "@repo/ui/components/shadcn/badge";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const statCards: {
  title: string;
  key:
    | "totalPosts"
    | "totalComments"
    | "totalReports"
    | "pendingReports"
    | "totalUsers"
    | "totalCategories";
  icon: LucideIcon;
  emphasize?: boolean;
}[] = [
  { title: "Total Posts", key: "totalPosts", icon: FileText },
  { title: "Total Comments", key: "totalComments", icon: MessageSquare },
  { title: "Total Reports", key: "totalReports", icon: Flag },
  {
    title: "Pending Reports",
    key: "pendingReports",
    icon: AlertTriangle,
    emphasize: true,
  },
  { title: "Total Users", key: "totalUsers", icon: Users },
  { title: "Total Categories", key: "totalCategories", icon: FolderOpen },
];

export default async function AdminDashboardPage() {
  const stats = await adminServerRequest.getStats();

  if (!stats) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Couldn&apos;t load stats. Try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Forum administration overview
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-xl border border-border bg-card p-6 transition-colors hover:border-[#4fae2e]/35 ${
              card.emphasize ? "border-[#4fae2e]/25 bg-[#eaf8df]/40 dark:bg-[#4fae2e]/10" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                  {stats[card.key]}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                <card.icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#4fae2e]" />
                <h2 className="text-sm font-semibold text-foreground">
                  Recent Posts
                </h2>
              </div>
              <Link
                href="/admin/posts"
                className="text-xs font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-2">
            {stats.recentPosts.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No posts yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-[#eaf8df]/35 dark:hover:bg-white/4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {post.user.profile?.displayName ??
                          `User #${post.user.id}`}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 border border-[#4fae2e]/20 bg-[#eaf8df] text-xs text-[#4fae2e] dark:bg-[#4fae2e]/15"
                    >
                      {new Date(post.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-[#4fae2e]" />
              <h2 className="text-sm font-semibold text-foreground">
                Quick Stats
              </h2>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Posts per Category
              </span>
              <span className="text-sm font-medium text-foreground">
                {stats.totalCategories > 0
                  ? (stats.totalPosts / stats.totalCategories).toFixed(1)
                  : "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Comments per Post
              </span>
              <span className="text-sm font-medium text-foreground">
                {stats.totalPosts > 0
                  ? (stats.totalComments / stats.totalPosts).toFixed(1)
                  : "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Reports per Post
              </span>
              <span className="text-sm font-medium text-foreground">
                {stats.totalPosts > 0
                  ? (stats.totalReports / stats.totalPosts).toFixed(1)
                  : "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Pending Report Rate
              </span>
              <span className="text-sm font-medium text-foreground">
                {stats.totalReports > 0
                  ? (
                      (stats.pendingReports / stats.totalReports) *
                      100
                    ).toFixed(0) + "%"
                  : "0%"}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Users</span>
              <span className="text-sm font-medium text-foreground">
                {stats.totalUsers}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Posts per User
              </span>
              <span className="text-sm font-medium text-foreground">
                {stats.totalUsers > 0
                  ? (stats.totalPosts / stats.totalUsers).toFixed(1)
                  : "0"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
