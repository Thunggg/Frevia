"use client";

import Link from "next/link";
import { Bell, Check, CheckCheck, Loader2, Trash2 } from "lucide-react";
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

export function NotificationsClient({ headerRole }: { headerRole: UserRole }) {
  const { data: notifications = [], isLoading, isError } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header role={headerRole} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Notifications
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Updates about jobs, proposals, contracts and your account.
            </p>
          </div>
          {unreadCount ? (
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
            >
              {markAllRead.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCheck />
              )}
              Mark all read
            </Button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="size-7 animate-spin text-[#4fae2e]" />
          </div>
        ) : isError ? (
          <div className="mt-8 rounded-xl border border-destructive/30 px-6 py-10 text-center">
            <p className="font-medium text-foreground">
              Notifications could not be loaded.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Refresh the page and try again.
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
              <Bell className="size-7" />
            </div>
            <h2 className="mt-4 text-lg font-medium text-foreground">
              No notifications yet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              New activity will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((notification) => {
              const href = notificationHref(notification.data);
              return (
                <li
                  key={notification.id}
                  className={`flex items-start gap-4 py-5 ${
                    notification.isRead
                      ? ""
                      : "bg-[#eaf8df]/25 dark:bg-[#4fae2e]/5"
                  }`}
                >
                  <div className="min-w-0 flex-1 px-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium text-foreground">
                        {notification.title ?? "Notification"}
                      </h2>
                      {!notification.isRead ? (
                        <span className="rounded-full bg-[#4fae2e]/10 px-2 py-0.5 text-xs font-medium text-[#3f9225] dark:text-[#70cf50]">
                          Unread
                        </span>
                      ) : null}
                    </div>
                    {notification.message ? (
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {notification.message}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <time
                        dateTime={new Date(
                          notification.createdAt,
                        ).toISOString()}
                      >
                        {new Date(notification.createdAt).toLocaleString()}
                      </time>
                      {href ? (
                        <Link
                          href={href}
                          className="font-medium text-[#4fae2e] hover:text-[#3f9225]"
                          onClick={() => {
                            if (!notification.isRead) {
                              markRead.mutate(notification.id);
                            }
                          }}
                        >
                          View details
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 pr-2">
                    {!notification.isRead ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Mark notification read"
                        disabled={markRead.isPending}
                        onClick={() => markRead.mutate(notification.id)}
                      >
                        <Check />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
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
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
