"use client";

import type { ReactNode } from "react";
import { useConversationSocket } from "@/hooks/use-conversation";
import { ConversationSocketContext } from "@/app/conversations/components/conversation-socket-context";

type AppSocketProviderProps = {
  socketUrl: string;
  token: string | null;
  currentUserId: number | null;
  children: ReactNode;
};

export function AppSocketProvider({
  socketUrl,
  token,
  currentUserId,
  children,
}: AppSocketProviderProps) {
  const socketValue = useConversationSocket(
    socketUrl,
    token,
    currentUserId,
  );

  return (
    <ConversationSocketContext.Provider value={socketValue}>
      {children}
    </ConversationSocketContext.Provider>
  );
}
