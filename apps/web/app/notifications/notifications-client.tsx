"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Loader2,
  MessageSquare,
  Star,
  Trash2,
} from "@/components/icons";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
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

function adaptHref(href: string | null, embedded?: boolean): string | null {
  if (!href) return null;
  if (embedded) {
    if (href.startsWith("/conversations")) {
      return href.replace("/conversations", "/client/conversations");
    }
  }
  return href;
}

function getNotificationIcon(type?: string) {
  switch (type) {
    case "MESSAGE_NEW":
      return MessageSquare;
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
      return Star;
    default:
      return Bell;
  }
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

type TabType = "ALL" | "UNREAD" | "READ";

export type NotificationsClientProps = {
  headerRole?: UserRole;
  embedded?: boolean;
  basePath?: string;
};

export function NotificationsClient({
  headerRole = "FREELANCER",
  embedded = false,
}: NotificationsClientProps) {
  const { data: notifications = [], isLoading, isError } = useNotifications();
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

  const content = (
    <div className={`w-full ${embedded ? "px-6 pt-8 pb-10 lg:px-8 max-w-5xl" : "mx-auto max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"}`}>
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-[#4fae2e]/10 px-2.5 py-0.5 text-xs font-semibold text-[#3f9225] dark:text-[#70cf50]">
                <span className="size-1.5 rounded-full bg-[#4fae2e] animate-pulse" />
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Updates about jobs, proposals, messages and account activities.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            disabled={markAllRead.isPending}
            onClick={() =>
              markAllRead.mutate(undefined, {
                onSuccess: () =>
                  toastSuccess({ message: "All notifications marked read." }),
                onError: () =>
                  toastError({ message: "Unable to update notifications." }),
              })
            }
            className="self-start sm:self-auto gap-2 rounded-full px-4 py-2 bg-[#F1F0F5] text-xs sm:text-sm font-semibold text-foreground dark:bg-zinc-800 hover:bg-black/5 dark:hover:bg-zinc-700 transition-colors"
          >
            {markAllRead.isPending ? (
              <Loader2 className="size-4 animate-spin text-[#4fae2e]" />
            ) : (
              <CheckCheck className="size-4 text-[#4fae2e]" />
            )}
            Mark all read
          </Button>
        )}
      </div>

      {/* ── Capsule Filter Tabs ── */}
      <div className="mt-6 flex items-center justify-between">
        <div className="inline-flex rounded-full bg-[#F3F3F7] p-1.5 border border-black/5 shadow-xs dark:bg-zinc-900/90 dark:border-white/10">
          {(
            [
              { id: "ALL", label: "All", count: notifications.length },
              { id: "UNREAD", label: "Unread", count: unreadCount },
              { id: "READ", label: "Read", count: readCount },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-white text-foreground shadow-xs font-semibold dark:bg-zinc-800"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-zinc-800/60 font-medium"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[11px] ${
                    isActive
                      ? "bg-[#F1F0F5] text-foreground dark:bg-zinc-700"
                      : "text-muted-foreground/70"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content Body ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <Loader2 className="size-8 animate-spin text-[#4fae2e]" />
          <p className="text-xs text-muted-foreground">Loading notifications...</p>
        </div>
      ) : isError ? (
        <div className="mt-8 rounded-[24px] border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
          <AlertTriangle className="mx-auto size-8 text-destructive" />
          <p className="mt-3 font-medium text-foreground">
            Notifications could not be loaded
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please refresh the page or try again later.
          </p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-border bg-[#FBFBFC] dark:bg-zinc-900/40 px-6 py-20 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
            <Bell className="size-7" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-foreground">
            {activeTab === "UNREAD"
              ? "All caught up!"
              : activeTab === "READ"
                ? "No read notifications"
                : "No notifications yet"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            {activeTab === "UNREAD"
              ? "You have read all of your recent notifications."
              : "New activity regarding jobs, proposals, and messages will appear here."}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <AnimatePresence initial={false}>
            {filteredNotifications.map((notification, index) => {
              const rawHref = notificationHref(notification.data);
              const href = adaptHref(rawHref, embedded);
              const Icon = getNotificationIcon(
                notification.type as string | undefined,
              );
              const isUnread = !notification.isRead;

              return (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25, delay: index * 0.03 }}
                  className={`group relative flex items-start gap-4 rounded-[24px] border p-4 sm:p-5 transition-all duration-200 ${
                    isUnread
                      ? "border-[#4fae2e]/30 bg-[#eaf8df]/15 hover:bg-[#eaf8df]/25 dark:border-[#4fae2e]/25 dark:bg-[#4fae2e]/5 dark:hover:bg-[#4fae2e]/10 shadow-xs"
                      : "border-black/[0.06] dark:border-white/[0.08] bg-card hover:border-black/15 dark:hover:border-white/15 hover:shadow-xs"
                  }`}
                >
                  {/* Context Icon */}
                  <div
                    className={`flex size-10 sm:size-11 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105 ${
                      isUnread
                        ? "bg-[#4fae2e]/15 text-[#3f9225] dark:text-[#70cf50]"
                        : "bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-5" />
                  </div>

                  {/* Body Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm ${
                          isUnread
                            ? "font-semibold text-foreground"
                            : "font-medium text-foreground/90"
                        }`}
                      >
                        {notification.title ?? "Notification"}
                      </h3>
                      {isUnread && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#4fae2e]/10 px-2 py-0.5 text-[10px] font-semibold text-[#3f9225] dark:text-[#70cf50]">
                          New
                        </span>
                      )}
                    </div>

                    {notification.message && (
                      <p className="mt-1 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                        {notification.message}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 text-muted-foreground/80">
                        <Clock className="size-3.5" />
                        <time
                          dateTime={new Date(
                            notification.createdAt,
                          ).toISOString()}
                          title={new Date(
                            notification.createdAt,
                          ).toLocaleString()}
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
                            if (isUnread) {
                              markRead.mutate(notification.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 font-semibold text-[#4fae2e] hover:text-[#3f9225] transition-colors"
                        >
                          <span>View details</span>
                          <ChevronRight className="size-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Mark as read"
                        aria-label="Mark notification read"
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(notification.id)}
                        className="size-8 rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-zinc-800"
                      >
                        <Check className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Delete"
                      aria-label="Delete notification"
                      disabled={deleteNotification.isPending}
                      onClick={() =>
                        deleteNotification.mutate(notification.id, {
                          onSuccess: () =>
                            toastSuccess({ message: "Notification deleted." }),
                          onError: () =>
                            toastError({
                              message: "Unable to delete notification.",
                            }),
                        })
                      }
                      className="size-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="min-h-full bg-background font-sans">
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={headerRole} />
      <main className="flex-1 flex flex-col">{content}</main>
      <Footer />
    </div>
  );
}
