"use client";

import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useNotificationContext } from "@/providers/notification-provider";

import { ConversationList } from "./conversation-list";
import { ConversationSocketContext } from "./conversation-socket-context";

type ConversationsShellProps = {
  socketUrl: string;
  token: string | null;
  currentUserId: number | null;
  children: ReactNode;
};

export function ConversationsShell({
  currentUserId,
  children,
}: ConversationsShellProps) {
  const pathname = usePathname();
  // Tái sử dụng duy nhất 1 kết nối /conversations từ NotificationProvider ở root layout
  const { conversationSocket, connected } = useNotificationContext();
  const socketValue = useMemo(
    () => ({ socket: conversationSocket, connected }),
    [conversationSocket, connected],
  );
  const basePath = pathname.startsWith("/client/conversations")
    ? "/client/conversations"
    : pathname.startsWith("/freelancer/conversations")
      ? "/freelancer/conversations"
      : "/conversations";
  const isThread =
    pathname.startsWith(`${basePath}/`) && pathname !== basePath;

  return (
    <ConversationSocketContext.Provider value={socketValue}>
      <div className="flex h-full bg-background">
        <div
          className={
            isThread
              ? "hidden h-full w-80 shrink-0 md:flex md:flex-col"
              : "flex h-full w-full shrink-0 flex-col md:w-80"
          }
        >
          <ConversationList currentUserId={currentUserId} />
        </div>
        <div
          className={
            isThread
              ? "flex min-w-0 flex-1 flex-col"
              : "hidden min-w-0 flex-1 md:flex md:flex-col"
          }
        >
          {children}
        </div>
      </div>
    </ConversationSocketContext.Provider>
  );
}
