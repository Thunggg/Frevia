"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useConversationSocket } from "@/hooks/use-conversation";

import { ConversationList } from "./conversation-list";
import { ConversationSocketContext } from "./conversation-socket-context";

type ConversationsShellProps = {
  socketUrl: string;
  token: string | null;
  currentUserId: number | null;
  children: ReactNode;
};

export function ConversationsShell({
  socketUrl,
  token,
  currentUserId,
  children,
}: ConversationsShellProps) {
  const pathname = usePathname();
  const socketValue = useConversationSocket(socketUrl, token, currentUserId);
  const isThread =
    pathname.startsWith("/conversations/") && pathname !== "/conversations";

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
