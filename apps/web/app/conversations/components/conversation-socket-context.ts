"use client";

import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";

type ConversationSocketContextValue = {
  socket: Socket | null;
  connected: boolean;
};

export const ConversationSocketContext =
  createContext<ConversationSocketContextValue>({
    socket: null,
    connected: false,
  });

export function useConversationSocketContext() {
  return useContext(ConversationSocketContext);
}
