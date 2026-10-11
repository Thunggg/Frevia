"use client";

import type { ReactNode } from "react";
import { useConversationSocket } from "@/hooks/use-conversation";
import { ConversationSocketContext } from "./conversation-socket-context";
import { ConversationList } from "./conversation-list";

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
  const socketValue = useConversationSocket(
    socketUrl,
    token,
    currentUserId,
  );

  return (
    <ConversationSocketContext.Provider value={socketValue}>
      <div className="flex h-full bg-background">
        <ConversationList currentUserId={currentUserId} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </ConversationSocketContext.Provider>
  );
}
