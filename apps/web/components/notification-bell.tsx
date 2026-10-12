"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useConversations } from "@/hooks/use-conversation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { MessageSquare, Paperclip } from "lucide-react";

function formatTime(createdAt?: string | Date | null): string {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MessageBell() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: conversations } = useConversations();

  const unreadConversations =
    conversations?.filter((c) => c.unreadCount > 0) ?? [];
  const totalUnread = unreadConversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0,
  );

  const isActive =
    pathname === "/conversations" || pathname.startsWith("/conversations/");

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={`relative rounded-full p-2 transition-colors ${
            isActive
              ? "bg-[#4fae2e]/10 text-[#4fae2e] dark:bg-[#4fae2e]/15"
              : "text-foreground/60 hover:bg-black/[0.04] hover:text-foreground dark:text-foreground/65 dark:hover:bg-white/[0.06]"
          }`}
          aria-label={`Messages${totalUnread > 0 ? `, ${totalUnread} unread` : ""}`}
        >
          <MessageSquare className="size-5" />
          {totalUnread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-[17px] items-center justify-center rounded-full bg-red-500 px-1 py-px text-[10px] font-bold leading-none text-white shadow-sm ring-[2.5px] ring-[#eaf8df]/80 dark:ring-[#161716]/80">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Messages</h3>
          {totalUnread > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {totalUnread} unread
            </span>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-80 overflow-y-auto">
          {unreadConversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <MessageSquare className="mx-auto mb-2 size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No unread messages
              </p>
            </div>
          ) : (
            unreadConversations.map((conversation) => {
              const name =
                conversation.otherUser.profile?.displayName ??
                `User #${conversation.otherUser.id}`;
              const avatar =
                conversation.otherUser.profile?.avatarUrl ?? undefined;
              return (
                <DropdownMenuItem
                  key={conversation.id}
                  asChild
                  className="cursor-pointer px-4 py-3 focus:bg-black/[0.03] dark:focus:bg-white/[0.04]"
                >
                  <Link
                    href={`/conversations/${conversation.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3"
                  >
                    <Avatar className="mt-0.5 size-9">
                      <AvatarImage src={avatar} alt={name} />
                      <AvatarFallback className="text-xs">
                        {name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {name}
                        </span>
                        {conversation.lastMessage && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {conversation.lastMessage?.fileUrl ? (
                            <span className="inline-flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              {conversation.lastMessage.fileName ??
                                "Attachment"}
                            </span>
                          ) : (
                            (conversation.lastMessage?.message ??
                            "No messages yet")
                          )}
                        </p>
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {conversation.unreadCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button
            variant="ghost"
            asChild
            className="w-full justify-center text-sm font-medium text-[#4fae2e] hover:text-[#3f9225] hover:bg-[#eaf8df]/80 dark:hover:bg-white/5"
          >
            <Link href="/conversations" onClick={() => setOpen(false)}>
              View all messages
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
