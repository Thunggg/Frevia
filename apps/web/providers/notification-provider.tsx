"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { useTranslations } from "next-intl";
import {
  appendMessageToConversationCaches,
  collectConversationMessageKeys,
  conversationKeys,
  removeMessageFromConversationCaches,
} from "@/hooks/use-conversation";
import { useNotificationText } from "@/hooks/use-notification-text";
import { notificationKeys } from "@/hooks/use-notifications";
import { toast } from "@repo/ui/components/shadcn/sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Lock, ShieldAlert, LogOut, Loader2 } from "lucide-react";
import type {
  ConversationListItemType,
  DirectMessageType,
  GetConversationsResponseType,
  NotificationItemType,
} from "@shared/types";

type NotificationContextValue = {
  connected: boolean;
  conversationSocket: Socket | null;
};

const NotificationContext = createContext<NotificationContextValue>({
  connected: false,
  conversationSocket: null,
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
  const t = useTranslations("auth.forceLogout");
  const tChat = useTranslations("chat");
  const notificationText = useNotificationText();
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [conversationSocket, setConversationSocket] = useState<Socket | null>(
    null,
  );
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "BANNED" | "SESSION_REVOKED" | "DEFAULT";
    customReason?: string;
  }>({
    isOpen: false,
    type: "DEFAULT",
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!socketUrl || !currentUserId) return;

    let cancelled = false;
    let activeToken = token;
    let refreshedOnReject = false;

    const socket = io(`${socketUrl}/conversations`, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      auth: (cb) => {
        cb({ token: activeToken ?? "" });
      },
    });

    const authSocket = io(`${socketUrl}/auth`, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      auth: (cb) => {
        cb({ token: activeToken ?? "" });
      },
    });

    const connectSockets = async (forceRefresh: boolean) => {
      if (forceRefresh || !activeToken) {
        try {
          const response = await fetch("/api/auth/socket-token", {
            method: "GET",
            cache: "no-store",
          });
          if (response.ok) {
            const body = (await response.json()) as {
              success?: boolean;
              data?: { token?: string };
            };
            if (!cancelled && body?.success && body?.data?.token) {
              activeToken = body.data.token;
            }
          }
        } catch {
          // Ignore network error; Socket.IO will retry later
        }
      }
      if (!cancelled && activeToken) {
        if (!socket.connected) socket.connect();
        if (!authSocket.connected) authSocket.connect();
      }
    };

    socket.on("connect", () => {
      refreshedOnReject = false;
      setConnected(true);
    });
    socket.on("disconnect", (reason) => {
      setConnected(false);
      if (reason === "io server disconnect" && !refreshedOnReject) {
        refreshedOnReject = true;
        void connectSockets(true);
      }
    });
    socket.on("connect_error", () => {
      setConnected(false);
      if (!refreshedOnReject) {
        refreshedOnReject = true;
        void connectSockets(true);
      }
    });

    socket.on("notification:new", (notification: NotificationItemType) => {
      queryClient.setQueryData<NotificationItemType[]>(
        notificationKeys.all,
        (old) => {
          if (!old) return old;
          return [
            notification,
            ...old.filter((item) => item.id !== notification.id),
          ];
        },
      );
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      const text = notificationText(
        notification,
        notification.title ?? "",
      );
      toast(text.title, {
        description: text.message || undefined,
        position: "top-right",
        duration: 4000,
      });
    });

    authSocket.on(
      "AUTH_FORCE_LOGOUT",
      (payload: { reason?: string; type?: string }) => {
        const isBanned =
          payload?.type === "BANNED" ||
          payload?.reason?.toLowerCase().includes("khóa") ||
          payload?.reason?.toLowerCase().includes("banned");

        const isRevoked =
          payload?.type === "SESSION_REVOKED" ||
          payload?.reason?.toLowerCase().includes("thu hồi") ||
          payload?.reason?.toLowerCase().includes("revoked");

        setModalState({
          isOpen: true,
          type: isBanned ? "BANNED" : isRevoked ? "SESSION_REVOKED" : "DEFAULT",
          customReason: payload?.reason,
        });
      },
    );

    socket.on(
      "message:new",
      (payload: { conversationId: number; message: DirectMessageType }) => {
        appendMessageToConversationCaches(queryClient, payload.message, [
          payload.conversationId,
        ]);
      },
    );

    socket.on(
      "message:deleted",
      (payload: { conversationId: number; messageId: number }) => {
        removeMessageFromConversationCaches(
          queryClient,
          payload.conversationId,
          payload.messageId,
        );
        void queryClient.invalidateQueries({
          queryKey: conversationKeys.list(),
        });
      },
    );

    socket.on(
      "conversation:updated",
      (item: ConversationListItemType) => {
        queryClient.setQueryData<GetConversationsResponseType>(
          conversationKeys.list(),
          (old) => {
            if (!old) return old;
            const previous = old.find((c) => c.id === item.id);
            const exists = Boolean(previous);
            const next = exists
              ? old.map((c) => (c.id === item.id ? item : c))
              : [...old, item];

            // Thông báo tin nhắn mới (recipient có unreadCount tăng)
            if (
              (item.unreadCount ?? 0) > (previous?.unreadCount ?? 0) &&
              item.lastMessage?.senderId !== currentUserId
            ) {
              const senderName =
                item.otherUser?.profile?.displayName ||
                tChat("newMessageFallbackTitle");
              toast(senderName, {
                description:
                  item.lastMessage?.message?.slice(0, 80) ||
                  tChat("newMessageFallbackBody"),
                position: "top-right",
                duration: 4000,
              });

              // Có tin nhắn mới -> làm mới danh sách thông báo trên chuông/trang notifications
              void queryClient.invalidateQueries({
                queryKey: notificationKeys.all,
              });
            }

            return sortByLastMessage(next);
          },
        );

        const keysToInvalidate = collectConversationMessageKeys(
          queryClient,
          item.id,
          [item.slug],
        );
        keysToInvalidate.forEach((key) => {
          void queryClient.invalidateQueries({
            queryKey: conversationKeys.messages(key),
          });
        });
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

    setConversationSocket(socket);
    void connectSockets(!activeToken);

    return () => {
      cancelled = true;
      socket.disconnect();
      authSocket.disconnect();
      setConversationSocket(null);
      setConnected(false);
    };
  }, [socketUrl, token, currentUserId, queryClient, notificationText, tChat]);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Bỏ qua lỗi mạng nếu có
    } finally {
      window.location.href = "/login";
    }
  };

  const modalTitle =
    modalState.type === "BANNED"
      ? t("bannedTitle")
      : modalState.type === "SESSION_REVOKED"
        ? t("revokedTitle")
        : t("defaultTitle");

  const modalDescription =
    modalState.type === "BANNED"
      ? t("bannedDescription")
      : modalState.type === "SESSION_REVOKED"
        ? t("revokedDescription")
        : modalState.customReason || t("defaultDescription");

  return (
    <NotificationContext.Provider value={{ connected, conversationSocket }}>
      {children}

      <AlertDialog open={modalState.isOpen}>
        <AlertDialogContent
          className="max-w-md border-border/80 p-6 shadow-2xl sm:max-w-md"
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <AlertDialogHeader className="flex flex-col items-center gap-3 text-center sm:items-center sm:text-center">
            <div
              className={`flex size-14 items-center justify-center rounded-full ${
                modalState.type === "BANNED"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
              }`}
            >
              {modalState.type === "BANNED" ? (
                <Lock className="size-7 stroke-[2.2]" />
              ) : (
                <ShieldAlert className="size-7 stroke-[2.2]" />
              )}
            </div>
            <AlertDialogTitle className="cursor-pointer text-xl font-bold tracking-tight text-foreground">
              {modalTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
              {modalDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4 sm:justify-center">
            <Button
              variant={modalState.type === "BANNED" ? "destructive" : "default"}
              className="w-full sm:w-auto min-w-36 font-medium gap-2"
              onClick={handleConfirmLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                <>
                  <LogOut className="size-4" />
                  {t("logoutButton")}
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </NotificationContext.Provider>
  );
}
