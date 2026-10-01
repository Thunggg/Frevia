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
import { getAdminStatsServer } from "@/lib/get-admin-data";
import { Badge } from "@repo/ui/components/shadcn/badge";
import Link from "next/link";

const statCards = [
  {
    title: "Total Posts",
    key: "totalPosts" as const,
    icon: FileText,
    gradient: "from-blue-500/10 to-blue-600/5",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200/50 dark:border-blue-800/50",
  },
  {
    title: "Total Comments",
    key: "totalComments" as const,
    icon: MessageSquare,
    gradient: "from-green-500/10 to-green-600/5",
    iconColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200/50 dark:border-green-800/50",
  },
  {
    title: "Total Reports",
    key: "totalReports" as const,
    icon: Flag,
    gradient: "from-orange-500/10 to-orange-600/5",
    iconColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200/50 dark:border-orange-800/50",
  },
  {
    title: "Pending Reports",
    key: "pendingReports" as const,
    icon: AlertTriangle,
    gradient: "from-red-500/10 to-red-600/5",
    iconColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-200/50 dark:border-red-800/50",
  },
  {
    title: "Total Users",
    key: "totalUsers" as const,
    icon: Users,
    gradient: "from-purple-500/10 to-purple-600/5",
    iconColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200/50 dark:border-purple-800/50",
  },
  {
    title: "Total Categories",
    key: "totalCategories" as const,
    icon: FolderOpen,
    gradient: "from-teal-500/10 to-teal-600/5",
    iconColor: "text-teal-600 dark:text-teal-400",
    borderColor: "border-teal-200/50 dark:border-teal-800/50",
  },
];

export default async function AdminDashboardPage() {
  const stats = await getAdminStatsServer();

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load stats. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Forum administration overview
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${card.gradient} ${card.borderColor} p-6 transition-all hover:shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </p>
                <p className="text-3xl font-bold mt-1 tracking-tight">
                  {stats[card.key]}
                </p>
              </div>
              <div
                className={`flex items-center justify-center h-12 w-12 rounded-xl bg-background/80 ${card.iconColor}`}
              >
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Recent Posts</h2>
              </div>
              <Link
                href="/admin/posts"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all →
              </Link>
            </div>
          </div>
          <div className="p-2">
            {stats.recentPosts.length === 0 ? (
              <p className="text-muted-foreground text-sm p-4 text-center">
                No posts yet.
              </p>
            ) : (
              <div className="space-y-0.5">
                {stats.recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {post.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {post.user.profile?.displayName ??
                          `User #${post.user.id}`}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Quick Stats</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Posts per Category
              </span>
              <span className="text-sm font-medium">
                {stats.totalCategories > 0
                  ? (stats.totalPosts / stats.totalCategories).toFixed(1)
                  : "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Comments per Post
              </span>
              <span className="text-sm font-medium">
                {stats.totalPosts > 0
                  ? (stats.totalComments / stats.totalPosts).toFixed(1)
                  : "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Reports per Post
              </span>
              <span className="text-sm font-medium">
                {stats.totalPosts > 0
                  ? (stats.totalReports / stats.totalPosts).toFixed(1)
                  : "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Pending Report Rate
              </span>
              <span className="text-sm font-medium">
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
              <span className="text-sm text-muted-foreground">
                Active Users
              </span>
              <span className="text-sm font-medium">{stats.totalUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Posts per User
              </span>
              <span className="text-sm font-medium">
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
