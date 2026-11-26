"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useActionPermission } from "@/hooks/use-action-permission";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  DollarSign,
  FileCheck,
  FileText,
  Heart,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldOff,
  Star,
  Trash2,
  UserPlus,
} from "@/components/icons";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { useNotificationText } from "@/hooks/use-notification-text";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";

function notificationHref(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("href" in data)) return null;
  return typeof data.href === "string" && data.href.startsWith("/")
    ? data.href
    : null;
}

function adaptHref(
  href: string | null,
  embedded?: boolean,
  basePath?: string,
): string | null {
  if (!href) return null;
  if (embedded && basePath && href.startsWith("/conversations")) {
    return href.replace("/conversations", `${basePath}/conversations`);
  }
  return href;
}

function getNotificationIcon(type?: string) {
  switch (type) {
    case "MESSAGE_NEW":
    case "POST_COMMENT":
      return MessageSquare;
    case "POST_LIKE":
      return Heart;
    case "NEW_FOLLOWER":
      return UserPlus;
    case "JOB_ALERT":
      return Briefcase;
    case "PROPOSAL_NEW":
    case "PROPOSAL_ACCEPTED":
      return FileText;
    case "CONTRACT_CREATED":
    case "MILESTONE_COMPLETED":
      return FileCheck;
    case "PAYMENT_RELEASED":
      return DollarSign;
    case "DISPUTE_OPENED":
    case "TASK_OVERDUE":
      return AlertTriangle;
    case "REVIEW_RECEIVED":
    case "REVIEW_RESPONSE_RECEIVED":
      return Star;
    default:
      return Bell;
  }
}

type TabType = "ALL" | "UNREAD" | "READ";

export type NotificationsClientProps = {
  headerRole?: UserRole;
  embedded?: boolean;
  basePath?: string;
};

function NotificationSkeletonList() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs divide-y divide-border/70">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-4 px-5 py-4 sm:px-6 sm:py-5"
        >
          <div className="size-10 shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-10 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-3.5 w-full max-w-lg animate-pulse rounded-md bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <div className="size-8 animate-pulse rounded-xl bg-muted" />
            <div className="size-8 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationsClient({
  headerRole = "FREELANCER",
  embedded = false,
  basePath,
}: NotificationsClientProps) {
  const t = useTranslations("notifications");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const notificationText = useNotificationText();
  const { can } = useActionPermission();
  const canViewNotifications = can("GET", "/api/notifications");
  const canMarkAllRead = can("PATCH", "/api/notifications/read-all");
  const canMarkRead = can("PATCH", "/api/notifications/:id/read");
  const canDeleteNotification = can("DELETE", "/api/notifications/:id");

  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
  } = useNotifications(canViewNotifications);

  const formatRelativeTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return tCommon("justNow");
      if (diffMins < 60) return tCommon("minutesAgo", { minutes: diffMins });
      if (diffHours < 24) return tCommon("hoursAgo", { hours: diffHours });
      if (diffDays < 7) return tCommon("daysAgo", { days: diffDays });
      return format.dateTime(date, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const [activeTab, setActiveTab] = useState<TabType>("ALL");

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const readCount = notifications.length - unreadCount;

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "UNREAD") return !item.isRead;
    if (activeTab === "READ") return item.isRead;
    return true;
  });

  if (!canViewNotifications) {
    const deniedContent = (
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-xs">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ShieldOff className="size-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            {t("loadFailedTitle")}
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            {t("loadFailedDescription")}
          </p>
        </div>
      </div>
    );

    if (embedded) {
      return (
        <div className="min-h-full bg-background font-sans">
          {deniedContent}
        </div>
      );
    }

    return (
      <div className="flex min-h-dvh flex-col bg-background font-sans">
        <Header role={headerRole} />
        <main className="flex flex-1 flex-col">{deniedContent}</main>
        <Footer />
      </div>
    );
  }

  const content = (
    <div className="flex-1 bg-background font-sans">
      {/* Page Header Band */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {t("title")}
                </h1>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-[#0069D3]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0069D3] dark:bg-[#0069D3]/20 dark:text-blue-300">
                    {t("newCount", { count: unreadCount })}
                  </span>
                )}
              </div>
              <p className="mt-1.5 max-w-[65ch] text-sm text-muted-foreground">
                {t("description")}
              </p>
            </div>

            {unreadCount > 0 && canMarkAllRead && (
              <Button
                type="button"
                variant="outline"
                disabled={markAllRead.isPending}
                onClick={() =>
                  markAllRead.mutate(undefined, {
                    onSuccess: () =>
                      toastSuccess({ message: t("markedAllRead") }),
                    onError: () =>
                      toastError({ message: t("updateFailed") }),
                  })
                }
                className="h-9 shrink-0 self-start whitespace-nowrap rounded-full border-border bg-card px-4 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-[#0069D3]/40 hover:bg-[#0069D3]/5 hover:text-[#0069D3] active:scale-[0.98] dark:hover:text-blue-300 sm:self-auto sm:text-sm cursor-pointer"
              >
                {markAllRead.isPending ? (
                  <Loader2 className="size-4 animate-spin text-[#0069D3]" />
                ) : (
                  <CheckCheck className="size-4 text-[#0069D3] dark:text-blue-400" />
                )}
                <span>{t("markAllRead")}</span>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Main Inbox Body */}
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Capsule Filter Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-border/60 bg-[#F1F0F5] p-1 dark:bg-zinc-900">
            {(
              [
                { id: "ALL", label: t("tabAll"), count: notifications.length },
                { id: "UNREAD", label: t("tabUnread"), count: unreadCount },
                { id: "READ", label: t("tabRead"), count: readCount },
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs transition-all cursor-pointer active:scale-[0.98] sm:text-sm ${
                    isActive
                      ? "bg-background font-semibold text-foreground shadow-xs"
                      : "font-medium text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0 text-[11px] font-semibold leading-tight ${
                      isActive
                        ? "bg-[#0069D3]/10 text-[#0069D3] dark:bg-[#0069D3]/25 dark:text-blue-300"
                        : "bg-muted-foreground/15 text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feed States */}
        {isLoading ? (
          <NotificationSkeletonList />
        ) : isError ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center">
            <AlertTriangle className="mx-auto size-8 text-destructive" />
            <p className="mt-3 text-base font-semibold text-foreground">
              {t("loadFailedTitle")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("loadFailedDescription")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              className="mt-5 h-9 rounded-full border-border bg-card px-4 text-xs font-semibold hover:border-[#0069D3]/40 hover:text-[#0069D3] active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>{t("loading").replace("...", "")}</span>
            </Button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#0069D3]/10 text-[#0069D3] dark:bg-[#0069D3]/20 dark:text-blue-300">
              <Bell className="size-6" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">
              {activeTab === "UNREAD"
                ? t("caughtUp")
                : activeTab === "READ"
                  ? t("noRead")
                  : t("empty")}
            </h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {activeTab === "UNREAD"
                ? t("caughtUpDescription")
                : t("emptyDescription")}
            </p>
          </div>
        ) : (
          <MotionConfig reducedMotion="user">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs divide-y divide-border/70">
              <AnimatePresence initial={false}>
                {filteredNotifications.map((notification, index) => {
                  const rawHref = notificationHref(notification.data);
                  const href = adaptHref(rawHref, embedded, basePath);
                  const Icon = getNotificationIcon(
                    notification.type as string | undefined,
                  );
                  const isUnread = !notification.isRead;
                  const text = notificationText(
                    notification,
                    t("fallbackTitle"),
                  );
                  const isRowMarkingRead =
                    markRead.isPending && markRead.variables === notification.id;
                  const isRowDeleting =
                    deleteNotification.isPending &&
                    deleteNotification.variables === notification.id;

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: 0.18,
                        delay: Math.min(index * 0.02, 0.16),
                      }}
                      className={`group relative flex items-start gap-4 border-l-[3px] px-4 py-4 transition-colors sm:px-6 sm:py-5 ${
                        isUnread
                          ? "border-l-[#0069D3] bg-[#0069D3]/[0.03] hover:bg-[#0069D3]/[0.06] dark:bg-[#0069D3]/[0.08] dark:hover:bg-[#0069D3]/[0.12]"
                          : "border-l-transparent bg-card hover:bg-muted/40"
                      }`}
                    >
                      {/* Context Icon */}
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-150 group-hover:scale-[1.03] ${
                          isUnread
                            ? "bg-[#0069D3]/10 text-[#0069D3] dark:bg-[#0069D3]/20 dark:text-blue-300"
                            : "bg-[#F1F0F5] text-muted-foreground dark:bg-zinc-800"
                        }`}
                      >
                        <Icon className="size-5" />
                      </div>

                      {/* Body Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={`text-sm leading-snug ${
                              isUnread
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/90"
                            }`}
                          >
                            {text.title}
                          </h3>
                          {isUnread && (
                            <span className="inline-flex items-center rounded-full bg-[#0069D3]/10 px-2 py-0.5 text-[11px] font-semibold leading-none text-[#0069D3] dark:bg-[#0069D3]/25 dark:text-blue-300">
                              {t("new")}
                            </span>
                          )}
                        </div>

                        {text.message && (
                          <p className="mt-1 max-w-[72ch] text-sm leading-relaxed text-muted-foreground">
                            {text.message}
                          </p>
                        )}

                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground/85">
                            <Clock className="size-3.5 shrink-0" />
                            <time
                              dateTime={new Date(
                                notification.createdAt,
                              ).toISOString()}
                              title={format.dateTime(
                                new Date(notification.createdAt),
                              )}
                            >
                              {formatRelativeTime(
                                new Date(notification.createdAt).toISOString(),
                              )}
                            </time>
                          </span>

                          {href && (
                            <Link
                              href={href}
                              onClick={() => {
                                if (isUnread && canMarkRead) {
                                  markRead.mutate(notification.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-[#0069D3] transition-colors hover:text-[#0055b3] dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <span>{t("viewDetails")}</span>
                              <ChevronRight className="size-3.5" />
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 items-center gap-1 self-start">
                        {isUnread && canMarkRead && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title={t("markAsRead")}
                            aria-label={t("markReadAria")}
                            disabled={isRowMarkingRead}
                            onClick={() => markRead.mutate(notification.id)}
                            className="size-8 rounded-xl text-muted-foreground transition-all hover:bg-[#0069D3]/10 hover:text-[#0069D3] active:scale-[0.98] dark:hover:text-blue-300 cursor-pointer"
                          >
                            {isRowMarkingRead ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Check className="size-4" />
                            )}
                          </Button>
                        )}
                        {canDeleteNotification && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title={t("delete")}
                            aria-label={t("deleteAria")}
                            disabled={isRowDeleting}
                            onClick={() =>
                              deleteNotification.mutate(notification.id, {
                                onSuccess: () =>
                                  toastSuccess({ message: t("deleted") }),
                                onError: () =>
                                  toastError({
                                    message: t("deleteFailed"),
                                  }),
                              })
                            }
                            className="size-8 rounded-xl text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive active:scale-[0.98] cursor-pointer"
                          >
                            {isRowDeleting ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </MotionConfig>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="min-h-full bg-background font-sans">{content}</div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={headerRole} />
      <main className="flex flex-1 flex-col">{content}</main>
      <Footer />
    </div>
  );
}
