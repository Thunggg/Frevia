"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { useTranslations } from "next-intl";
import { conversationKeys } from "@/hooks/use-conversation";
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
  const t = useTranslations("auth.forceLogout");
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
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
    if (!socketUrl || !token || !currentUserId) return;

    const socket = io(`${socketUrl}/conversations`, {
      transports: ["websocket"],
      auth: { token },
    });

    const authSocket = io(`${socketUrl}/auth`, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

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
      authSocket.disconnect();
      setConnected(false);
    };
  }, [socketUrl, token, currentUserId, queryClient]);

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
    <NotificationContext.Provider value={{ connected }}>
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
