"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";

function notificationHref(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("href" in data)) return null;
  return typeof data.href === "string" && data.href.startsWith("/")
    ? data.href
    : null;
}

export function NotificationsBell() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unread = notifications.filter((notification) => !notification.isRead);
  const recent = notifications.slice(0, 5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative rounded-full p-2 text-foreground/60 transition-colors hover:bg-black/[0.04] hover:text-foreground dark:text-foreground/65 dark:hover:bg-white/[0.06]"
          aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}
        >
          <Bell className="size-5" />
          {unread.length ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-[17px] items-center justify-center rounded-full bg-red-500 px-1 py-px text-[10px] font-bold leading-none text-white ring-[2.5px] ring-background">
              {unread.length > 99 ? "99+" : unread.length}
            </span>
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            <p className="text-xs text-muted-foreground">
              {unread.length} unread
            </p>
          </div>
          {unread.length ? (
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-medium text-[#4fae2e] hover:text-[#3f9225] disabled:opacity-50"
              disabled={markAllRead.isPending}
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Loading notifications...
            </p>
          ) : recent.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="mx-auto mb-2 size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            recent.map((notification) => {
              const href = notificationHref(notification.data);
              const content = (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {notification.title ?? "Notification"}
                  </p>
                  {notification.message ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                  ) : null}
                </div>
              );
              return (
                <DropdownMenuItem
                  key={notification.id}
                  asChild
                  className="cursor-pointer gap-3 px-4 py-3"
                  onSelect={() => {
                    if (!notification.isRead) markRead.mutate(notification.id);
                  }}
                >
                  {href ? (
                    <Link href={href}>{content}</Link>
                  ) : (
                    <button type="button" className="flex w-full text-left">
                      {content}
                    </button>
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Link
            href="/notifications"
            className="block rounded-md px-3 py-2 text-center text-sm font-medium text-[#4fae2e] hover:bg-[#eaf8df] dark:hover:bg-[#4fae2e]/10"
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
