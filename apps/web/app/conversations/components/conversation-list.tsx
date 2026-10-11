"use client";

import { useState } from "react";
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
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  CheckCheck,
  Ellipsis,
  Loader2,
  MessageSquare,
  Paperclip,
  Pin,
  PinOff,
  Plus,
  Trash2,
} from "lucide-react";
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
  const [conversationToDelete, setConversationToDelete] = useState<
    number | null
  >(null);

  const deleting = hideConversation.isPending;

  const handleDelete = () => {
    if (conversationToDelete == null) return;

    hideConversation.mutate(conversationToDelete, {
      onSuccess: () => {
        toastSuccess({ message: "Conversation deleted" });
        // Nếu đang xem conversation bị xóa thì quay về danh sách
        if (pathname === `/conversations/${conversationToDelete}`) {
          router.push("/conversations");
        }
      },
      onError: (error) => {
        toastError({ message: error.message || "Failed to delete conversation" });
      },
      onSettled: () => setConversationToDelete(null),
    });
  };

  const handleMarkAsRead = (conversationId: number) => {
    if (markRead.isPending) return;
    markRead.mutate(conversationId, {
      onError: (error) => {
        toastError({ message: error.message || "Failed to mark as read" });
      },
    });
  };

  const handleTogglePin = (conversationId: number, pinned: boolean) => {
    if (pinConversation.isPending) return;
    pinConversation.mutate(
      { conversationId, pinned: !pinned },
      {
        onError: (error) => {
          toastError({ message: error.message || "Failed to update pin" });
        },
      },
    );
  };

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-[#eaf8df]/50 px-4 py-3 dark:bg-[#12331f]/40">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <MessageSquare className="h-5 w-5 text-[#4fae2e]" />
          Messages
        </h2>
        <NewConversationDialog
          trigger={
            <Button variant="outline" size="icon" className="h-8 w-8 border-[#4fae2e]/30 text-[#4fae2e] hover:bg-[#eaf8df] hover:text-[#3f9225] dark:hover:bg-[#12331f]">
              <Plus className="h-4 w-4" />
              <span className="sr-only">New conversation</span>
            </Button>
          }
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <Skeleton className="h-3.5 w-44" />
                </div>
              </div>
            ))}
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No conversations yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Start a new conversation to send a message.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {conversations.map((conversation) => {
              const displayName =
                conversation.otherUser.profile?.displayName ??
                `User #${conversation.otherUser.id}`;
              const avatarUrl =
                conversation.otherUser.profile?.avatarUrl ?? undefined;
              const isActive = pathname === `/conversations/${conversation.id}`;

              return (
                <li
                  key={conversation.id}
                  className="group relative flex items-center"
                >
                  <Link
                    href={`/conversations/${conversation.id}`}
                    className={`flex flex-1 items-start gap-3 px-4 py-3 transition-colors hover:bg-[#eaf8df]/80 dark:hover:bg-[#12331f]/50 ${
                      isActive ? "!bg-[#eaf8df] border-r-[3px] !border-r-[#4fae2e] dark:!bg-[#12331f]" : ""
                    }`}
                  >
                    <Avatar className="mt-0.5">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback>
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {conversation.pinnedAt && (
                            <Pin className="mr-1 inline-block h-3 w-3 shrink-0 -translate-y-px text-muted-foreground" />
                          )}
                          {displayName}
                        </p>
                        {conversation.lastMessage && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                          {conversation.lastMessage ? (
                            <>
                              {conversation.lastMessage.senderId ===
                                currentUserId && (
                                <span className="font-medium text-foreground/70">
                                  You:{" "}
                                </span>
                              )}
                              {conversation.lastMessage.fileUrl ? (
                                <span className="inline-flex items-center gap-1">
                                  <Paperclip className="h-3 w-3 shrink-0" />
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
                          <Badge className="shrink-0 rounded-full bg-[#4fae2e] px-1.5 py-0 text-xs text-white hover:bg-[#4fae2e]">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Menu "..." với các action */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <Ellipsis className="h-4 w-4" />
                        <span className="sr-only">More actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={pinConversation.isPending}
                        onSelect={() =>
                          handleTogglePin(
                            conversation.id,
                            Boolean(conversation.pinnedAt),
                          )
                        }
                      >
                        {conversation.pinnedAt ? <PinOff /> : <Pin />}
                        {conversation.pinnedAt ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={conversation.unreadCount === 0 || markRead.isPending}
                        onSelect={() => handleMarkAsRead(conversation.id)}
                      >
                        <CheckCheck />
                        Mark as read
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={deleting}
                        onSelect={() =>
                          setConversationToDelete(conversation.id)
                        }
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Xác nhận xóa hội thoại */}
      <AlertDialog
        open={conversationToDelete != null}
        onOpenChange={(open) => {
          if (!open) setConversationToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This conversation will be deleted only on your side. The other
              person will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
