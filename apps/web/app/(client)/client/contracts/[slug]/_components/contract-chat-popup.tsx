"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useConversations } from "@/hooks/use-conversation";
import { useNotificationContext } from "@/providers/notification-provider";
import { ConversationSocketContext } from "@/app/conversations/components/conversation-socket-context";
import { ChatView } from "@/app/conversations/components/chat-view";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/shadcn/avatar";
import { Loader2, X } from "lucide-react";

export interface ContractChatPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: number | null;
  counterpartyId: number;
  counterpartyName: string;
  counterpartyAvatarUrl?: string | null;
  currentUserId?: number | null;
  accessToken?: string | null;
  socketUrl?: string;
  isStartingChat?: boolean;
  onOpenChat: (counterpartyId: number) => Promise<void> | void;
}

export function ContractChatPopup({
  open,
  onOpenChange,
  conversationId,
  counterpartyId,
  counterpartyName,
  counterpartyAvatarUrl,
  currentUserId,
  isStartingChat = false,
  onOpenChat,
}: ContractChatPopupProps) {
  const t = useTranslations("contractWorkspace");
  const { conversationSocket, connected } = useNotificationContext();
  const socketValue = useMemo(
    () => ({ socket: conversationSocket, connected }),
    [conversationSocket, connected],
  );
  const { data: conversations = [] } = useConversations();

  const unreadMessages = (conversations ?? []).reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0,
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && conversationId ? (
        <div className="relative w-[360px] max-w-[calc(100vw-3rem)] h-[520px] rounded-2xl border border-border bg-background shadow-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label={t("closeChatAria")}
          >
            <X className="size-4" />
          </button>
          <ConversationSocketContext.Provider value={socketValue}>
            <ChatView
              conversationId={conversationId}
              currentUserId={currentUserId ?? null}
            />
          </ConversationSocketContext.Provider>
        </div>
      ) : null}

      <div className="relative overflow-visible">
        {unreadMessages > 0 ? (
          <span className="pointer-events-none absolute -top-8 -right-2 z-40 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow ring-2 ring-background">
            {unreadMessages > 99 ? "99+" : unreadMessages}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() =>
            open ? onOpenChange(false) : void onOpenChat(counterpartyId)
          }
          disabled={isStartingChat}
          className="flex size-14 items-center justify-center overflow-hidden rounded-full border border-border bg-card shadow-lg transition-transform hover:scale-105 cursor-pointer"
          aria-label={t("toggleChatAria")}
        >
          {isStartingChat ? (
            <Loader2 className="size-5 animate-spin text-[#0069D3]" />
          ) : (
            <Avatar className="size-12">
              <AvatarImage
                src={counterpartyAvatarUrl || undefined}
                className="object-cover"
              />
              <AvatarFallback className="text-xs font-bold">
                {counterpartyName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
        </button>
      </div>
    </div>
  );
}
