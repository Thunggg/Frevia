"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { conversationKeys } from "@/hooks/use-conversation";
import type {
  ConversationListItemType,
  GetConversationsResponseType,
} from "@shared/types";

type NotificationContextValue = {
  connected: boolean;
};

const NotificationContext = createContext<NotificationContextValue>({
  connected: false,
});

export function useNotificationContext() {
  return useContext(NotificationContext);
}

function sortByLastMessage(items: GetConversationsResponseType) {
  return [...items].sort((a, b) => {
    if (a.pinnedAt && b.pinnedAt) {
      return new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime();
    }
    if (a.pinnedAt) return -1;
    if (b.pinnedAt) return 1;
    const aTime = a.lastMessage?.createdAt ?? a.createdAt;
    const bTime = b.lastMessage?.createdAt ?? b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
}

export function NotificationProvider({
  socketUrl,
  token,
  currentUserId,
  children,
}: {
  socketUrl: string;
  token: string | null;
  currentUserId: number | null;
  children: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socketUrl || !token || !currentUserId) return;

    const socket = io(`${socketUrl}/conversations`, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on(
      "conversation:updated",
      (item: ConversationListItemType) => {
        queryClient.setQueryData<GetConversationsResponseType>(
          conversationKeys.list(),
          (old) => {
            if (!old) return old;
            const exists = old.some((c) => c.id === item.id);
            const next = exists
              ? old.map((c) => (c.id === item.id ? item : c))
              : [...old, item];
            return sortByLastMessage(next);
          },
        );
      },
    );

    socket.on(
      "conversation:hidden",
      (payload: { conversationId: number }) => {
        queryClient.setQueryData<GetConversationsResponseType>(
          conversationKeys.list(),
          (old) => {
            if (!old) return old;
            return old.filter((c) => c.id !== payload.conversationId);
          },
        );
      },
    );

    return () => {
      socket.disconnect();
      setConnected(false);
    };
  }, [socketUrl, token, currentUserId, queryClient]);

  return (
    <NotificationContext.Provider value={{ connected }}>
      {children}
    </NotificationContext.Provider>
  );
}
