import { getFormatter, getTranslations } from "next-intl/server";
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
  labelKey: string;
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
  { labelKey: "statTotalPosts", key: "totalPosts", icon: FileText },
  { labelKey: "statTotalComments", key: "totalComments", icon: MessageSquare },
  { labelKey: "statTotalReports", key: "totalReports", icon: Flag },
  {
    labelKey: "statPendingReports",
    key: "pendingReports",
    icon: AlertTriangle,
    emphasize: true,
  },
  { labelKey: "statTotalUsers", key: "totalUsers", icon: Users },
  {
    labelKey: "statTotalCategories",
    key: "totalCategories",
    icon: FolderOpen,
  },
];

export default async function AdminDashboardPage() {
  const stats = await adminServerRequest.getStats();
  const t = await getTranslations("adminDashboard");
  const format = await getFormatter();

  if (!stats) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {t("loadFailed")}
      </div>
    );
  }

  const average = (total: number, divisor: number) =>
    divisor > 0
      ? format.number(total / divisor, { maximumFractionDigits: 1 })
      : format.number(0);

  const pendingRate =
    stats.totalReports > 0
      ? format.number(stats.pendingReports / stats.totalReports, {
          style: "percent",
          maximumFractionDigits: 0,
        })
      : format.number(0, { style: "percent" });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div
            key={card.labelKey}
            className={`rounded-xl border border-border bg-card p-6 transition-colors hover:border-[#4fae2e]/35 ${
              card.emphasize ? "border-[#4fae2e]/25 bg-[#eaf8df]/40 dark:bg-[#4fae2e]/10" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t(card.labelKey)}
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
                  {format.number(stats[card.key])}
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
                  {t("recentPosts")}
                </h2>
              </div>
              <Link
                href="/admin/posts"
                className="text-xs font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
              >
                {t("viewAll")}
              </Link>
            </div>
          </div>
          <div className="p-2">
            {stats.recentPosts.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {t("noPosts")}
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
                          t("userFallback", { id: post.user.id })}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 border border-[#4fae2e]/20 bg-[#eaf8df] text-xs text-[#4fae2e] dark:bg-[#4fae2e]/15"
                    >
                      {format.dateTime(new Date(post.createdAt), {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
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
                {t("quickStats")}
              </h2>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("postsPerCategory")}
              </span>
              <span className="text-sm font-medium text-foreground">
                {average(stats.totalPosts, stats.totalCategories)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("commentsPerPost")}
              </span>
              <span className="text-sm font-medium text-foreground">
                {average(stats.totalComments, stats.totalPosts)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("reportsPerPost")}
              </span>
              <span className="text-sm font-medium text-foreground">
                {average(stats.totalReports, stats.totalPosts)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("pendingReportRate")}
              </span>
              <span className="text-sm font-medium text-foreground">
                {pendingRate}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("activeUsers")}
              </span>
              <span className="text-sm font-medium text-foreground">
                {format.number(stats.totalUsers)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("postsPerUser")}
              </span>
              <span className="text-sm font-medium text-foreground">
                {average(stats.totalPosts, stats.totalUsers)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
