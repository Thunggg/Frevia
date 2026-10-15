"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useConversations,
  useHideConversation,
  useMarkConversationRead,
  usePinConversation,
} from "@/hooks/use-conversation";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  CheckCheck,
  ChevronRight,
  Ellipsis,
  Loader2,
  MessageSquare,
  Paperclip,
  Pin,
  PinOff,
  Plus,
  Search,
  Trash2,
  X,
} from "@/components/icons";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { NewConversationDialog } from "./new-conversation-dialog";

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
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

type ConversationListProps = {
  currentUserId: number | null;
};

export function ConversationList({ currentUserId }: ConversationListProps) {
  const { data: conversations, isLoading } = useConversations();
  const pathname = usePathname();
  const router = useRouter();
  const hideConversation = useHideConversation();
  const markRead = useMarkConversationRead();
  const pinConversation = usePinConversation();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationToDelete, setConversationToDelete] = useState<
    number | null
  >(null);
  const basePath = pathname.startsWith("/client/conversations")
    ? "/client/conversations"
    : "/conversations";

  const deleting = hideConversation.isPending;

  const handleDelete = () => {
    if (conversationToDelete == null) return;

    hideConversation.mutate(conversationToDelete, {
      onSuccess: () => {
        toastSuccess({ message: "Conversation deleted" });
        if (pathname === `${basePath}/${conversationToDelete}`) {
          router.push(basePath);
        }
      },
      onError: (error) => {
        toastError({ message: error.message || "Couldn't delete chat. Try again." });
      },
      onSettled: () => setConversationToDelete(null),
    });
  };

  const handleMarkAsRead = (conversationId: number) => {
    if (markRead.isPending) return;
    markRead.mutate(conversationId, {
      onError: (error) => {
        toastError({ message: error.message || "Couldn't mark as read. Try again." });
      },
    });
  };

  const handleTogglePin = (conversationId: number, pinned: boolean) => {
    if (pinConversation.isPending) return;
    pinConversation.mutate(
      { conversationId, pinned: !pinned },
      {
        onError: (error) => {
          toastError({ message: error.message || "Couldn't update pin. Try again." });
        },
      },
    );
  };

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const name = c.otherUser.profile?.displayName ?? `User #${c.otherUser.id}`;
      const msg = c.lastMessage?.message ?? "";
      return name.toLowerCase().includes(query) || msg.toLowerCase().includes(query);
    });
  }, [conversations, searchQuery]);

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-background font-sans">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border bg-background/80 backdrop-blur p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
            Messages
          </h2>
          <NewConversationDialog
            trigger={
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full bg-[#0069D3] text-white hover:bg-[#0058b3] shadow-xs cursor-pointer transition-colors outline-none"
                title="New conversation"
              >
                <Plus className="size-4" />
              </button>
            }
          />
        </div>

        {/* Search inside conversation list */}
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="h-8 w-full rounded-full bg-[#F3F3F7] dark:bg-zinc-800/80 pl-8 pr-7 text-xs font-normal text-foreground placeholder:text-muted-foreground border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-[#0069D3]/30 transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-2.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="space-y-1 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl p-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3.5 w-24 rounded-full" />
                    <Skeleton className="h-2.5 w-10 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-40 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground">
              <MessageSquare className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              No conversations yet
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              Start a chat with another user to collaborate on projects.
            </p>
            <div className="mt-4 flex justify-center">
              <NewConversationDialog
                trigger={
                  <Button className="rounded-full bg-[#0069D3] text-white hover:bg-[#0058b3] text-xs font-semibold px-4 py-2 cursor-pointer shadow-xs gap-1.5">
                    <Plus className="size-3.5" />
                    Start a chat
                  </Button>
                }
              />
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs text-muted-foreground">
            No chats match &quot;{searchQuery}&quot;
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filteredConversations.map((conversation) => {
              const displayName =
                conversation.otherUser.profile?.displayName ??
                `User #${conversation.otherUser.id}`;
              const avatarUrl =
                conversation.otherUser.profile?.avatarUrl ?? undefined;
              const isActive = pathname === `${basePath}/${conversation.id}`;

              return (
                <li
                  key={conversation.id}
                  className="group relative px-2"
                >
                  <Link
                    href={`${basePath}/${conversation.id}`}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-150 ${
                      isActive
                        ? "bg-[#D0E1F8] dark:bg-[#0069D3]/25 text-[#0069D3] dark:text-blue-100 shadow-xs font-medium"
                        : "text-muted-foreground hover:bg-[#D0E1F8]/40 dark:hover:bg-zinc-800/50 hover:text-foreground"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="size-10 rounded-full">
                        <AvatarImage src={avatarUrl} alt={displayName} />
                        <AvatarFallback className="bg-muted text-xs font-bold text-foreground">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex size-2.5 rounded-full bg-[#0069D3] ring-2 ring-background" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 pr-6">
                      <div className="flex items-baseline justify-between gap-1.5">
                        <p className="truncate text-xs sm:text-sm font-bold text-foreground font-sans flex items-center gap-1">
                          {conversation.pinnedAt ? (
                            <Pin className="size-3 text-[#0069D3] shrink-0" />
                          ) : null}
                          <span className="truncate">{displayName}</span>
                        </p>
                        {conversation.lastMessage ? (
                          <span className="shrink-0 text-[10px] text-muted-foreground font-normal">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground font-normal">
                          {conversation.lastMessage ? (
                            <>
                              {conversation.lastMessage.senderId ===
                                currentUserId && (
                                <span className="font-semibold text-foreground/70">
                                  You:{" "}
                                </span>
                              )}
                              {conversation.lastMessage.fileUrl ? (
                                <span className="inline-flex items-center gap-1">
                                  <Paperclip className="size-3 shrink-0" />
                                  {conversation.lastMessage.fileName ??
                                    "Attachment"}
                                </span>
                              ) : (
                                conversation.lastMessage.message
                              )}
                            </>
                          ) : (
                            "No messages yet"
                          )}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-[#0069D3] px-1.5 py-0.2 text-[10px] font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Menu "..." actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full bg-background/80 hover:bg-[#F1F0F5] dark:hover:bg-zinc-700 text-muted-foreground hover:text-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 cursor-pointer shadow-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Ellipsis className="size-3.5" />
                        <span className="sr-only">More actions</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={4}
                      className="w-44 rounded-[22px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-1.5 shadow-2xl flex flex-col gap-1 font-sans"
                    >
                      <DropdownMenuItem
                        disabled={pinConversation.isPending}
                        className="rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer"
                        onSelect={() =>
                          handleTogglePin(
                            conversation.id,
                            Boolean(conversation.pinnedAt),
                          )
                        }
                      >
                        {conversation.pinnedAt ? (
                          <PinOff className="size-3.5 mr-2" />
                        ) : (
                          <Pin className="size-3.5 mr-2" />
                        )}
                        {conversation.pinnedAt ? "Unpin chat" : "Pin chat"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={
                          conversation.unreadCount === 0 || markRead.isPending
                        }
                        className="rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer"
                        onSelect={() => handleMarkAsRead(conversation.id)}
                      >
                        <CheckCheck className="size-3.5 mr-2" />
                        Mark as read
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={deleting}
                        className="rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-600"
                        onSelect={() =>
                          setConversationToDelete(conversation.id)
                        }
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modern Capsule Delete Dialog */}
      <AlertDialog
        open={conversationToDelete != null}
        onOpenChange={(open) => {
          if (!open) setConversationToDelete(null);
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-[26px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <div className="px-1">
              <AlertDialogTitle className="text-base font-bold text-foreground font-sans">
                Delete conversation
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-xs text-muted-foreground leading-normal font-sans">
                Removes this chat from your list only. The other person keeps their copy.
              </AlertDialogDescription>
            </div>

            <div className="mt-1 flex flex-col gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="group flex w-full items-center justify-between rounded-full px-3.5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 cursor-pointer transition-all duration-200 outline-none disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 shadow-xs transition-transform group-hover:scale-105">
                    {deleting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </div>
                  <span className="text-xs font-semibold">Delete chat</span>
                </div>
                <ChevronRight className="size-3.5 text-red-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <AlertDialogCancel asChild>
                <button
                  type="button"
                  disabled={deleting}
                  className="group flex w-full items-center justify-between rounded-full px-3.5 py-2.5 bg-[#F1F0F5] hover:bg-[#EAE9F0] dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-foreground cursor-pointer transition-all duration-200 outline-none border-0 m-0 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-700 text-muted-foreground shadow-xs transition-transform group-hover:scale-105">
                      <X className="size-3.5" />
                    </div>
                    <span className="text-xs font-medium">Cancel</span>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </button>
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
