import { useCallback, useEffect, useState } from "react";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { conversationApiRequest } from "@/apiRequests/conversation";
import { useApiDataExtractor } from "@/hooks/use-api-data-extractor";
import type {
  ConversationListItemType,
  DirectMessageType,
  GetConversationsResponseType,
  GetMessagesResponseType,
  MessageAttachmentType,
} from "@shared/types";

export const conversationKeys = {
  // Key gốc cho toàn bộ module hội thoại
  all: ["conversations"] as const,

  // Key cho danh sách hội thoại của user hiện tại
  list: () => ["conversations", "list"] as const,

  // Key cho thông tin chi tiết của 1 hội thoại
  detail: (idOrSlug: number | string) =>
    ["conversations", "detail", idOrSlug] as const,

  // Key cho danh sách tin nhắn của 1 hội thoại
  messages: (conversationId: number | string) =>
    ["conversations", "messages", conversationId] as const,
};

function sortByLastMessage(items: GetConversationsResponseType) {
  return [...items].sort((a, b) => {
    // Hội thoại đã ghim xếp trên
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

function collectConversationMessageKeys(
  queryClient: QueryClient,
  conversationId: number | string,
  extraKeys: Array<number | string | null | undefined> = [],
): Array<number | string> {
  const keys = new Set<number | string>();
  const addKey = (val: number | string | null | undefined) => {
    if (val === null || val === undefined) return;
    if (typeof val === "number" && val > 0) {
      keys.add(val);
      keys.add(String(val));
    } else if (typeof val === "string" && val.trim()) {
      keys.add(val);
      const asNum = Number(val);
      if (Number.isInteger(asNum) && asNum > 0) {
        keys.add(asNum);
      }
    }
  };

  addKey(conversationId);
  extraKeys.forEach(addKey);

  const conversations = queryClient.getQueryData<GetConversationsResponseType>(
    conversationKeys.list(),
  );
  const matched = conversations?.find(
    (c) =>
      c.id === Number(conversationId) ||
      c.slug === String(conversationId) ||
      extraKeys.some((k) => k != null && (c.id === Number(k) || c.slug === String(k))),
  );
  if (matched) {
    addKey(matched.id);
    addKey(matched.slug);
  }

  return Array.from(keys);
}

export function appendMessageToConversationCaches(
  queryClient: QueryClient,
  message: DirectMessageType,
  extraKeys: Array<number | string | null | undefined> = [],
) {
  const keys = collectConversationMessageKeys(
    queryClient,
    message.conversationId,
    extraKeys,
  );

  let updatedAny = false;
  for (const key of keys) {
    const queryKey = conversationKeys.messages(key);
    const state = queryClient.getQueryState(queryKey);
    if (!state) continue;

    updatedAny = true;
    queryClient.setQueryData<GetMessagesResponseType>(queryKey, (old) => {
      if (!old) return [message];
      if (old.some((m) => m.id === message.id)) return old;
      return [...old, message];
    });
  }

  if (!updatedAny) {
    queryClient.setQueryData<GetMessagesResponseType>(
      conversationKeys.messages(message.conversationId),
      (old) => {
        if (!old) return [message];
        if (old.some((m) => m.id === message.id)) return old;
        return [...old, message];
      },
    );
  }
}

export function removeMessageFromConversationCaches(
  queryClient: QueryClient,
  conversationId: number | string,
  messageId: number,
  extraKeys: Array<number | string | null | undefined> = [],
) {
  const keys = collectConversationMessageKeys(
    queryClient,
    conversationId,
    extraKeys,
  );

  for (const key of keys) {
    const queryKey = conversationKeys.messages(key);
    if (!queryClient.getQueryState(queryKey)) continue;
    queryClient.setQueryData<GetMessagesResponseType>(queryKey, (old) => {
      if (!old) return old;
      return old.filter((m) => m.id !== messageId);
    });
  }
}

async function fetchFreshSocketToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/socket-token", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      success?: boolean;
      data?: { token?: string };
    };
    return body?.success && body?.data?.token ? body.data.token : null;
  } catch {
    return null;
  }
}

/**
 * Lấy danh sách hội thoại của user hiện tại.
 * Mỗi hội thoại kèm tin nhắn cuối (preview) và số tin nhắn chưa đọc.
 */
export function useConversations(enabled = true) {
  const extractData = useApiDataExtractor("chat");

  return useQuery({
    queryKey: conversationKeys.list(),
    queryFn: () =>
      conversationApiRequest.getConversations().then(extractData),
    staleTime: 30 * 1000,
    enabled,
  });
}

/**
 * Lấy chi tiết 1 hội thoại theo id hoặc slug.
 */
export function useConversationDetail(
  conversationIdOrSlug: number | string | null | undefined,
  enabled = true,
) {
  const extractData = useApiDataExtractor("chat");

  return useQuery({
    queryKey: conversationIdOrSlug
      ? conversationKeys.detail(conversationIdOrSlug)
      : (["conversations", "detail", "empty"] as const),
    queryFn: () =>
      conversationIdOrSlug
        ? conversationApiRequest
            .getConversation(conversationIdOrSlug)
            .then(extractData)
        : null,
    enabled: Boolean(conversationIdOrSlug) && enabled,
    staleTime: 30 * 1000,
  });
}

/**
 * Lấy danh sách tin nhắn của 1 hội thoại.
 */
export function useConversationMessages(
  conversationId: number | string,
  enabled = true,
) {
  const extractData = useApiDataExtractor("chat");

  return useQuery({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: () =>
      conversationApiRequest
        .getMessages(conversationId)
        .then(extractData),
    enabled:
      (typeof conversationId === "number"
        ? conversationId > 0
        : Boolean(conversationId && conversationId.trim())) && enabled,
    staleTime: 15 * 1000,
  });
}

/**
 * Gửi tin nhắn bằng REST (fallback khi socket không hoạt động).
 */
export function useSendConversationMessage() {
  const extractData = useApiDataExtractor("chat");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      message,
      attachment,
    }: {
      conversationId: number | string;
      slug?: string;
      message: string;
      attachment?: MessageAttachmentType;
    }) =>
      conversationApiRequest
        .sendMessage(conversationId, message, attachment)
        .then(extractData),

    onSuccess: (message, variables) => {
      appendMessageToConversationCaches(queryClient, message, [
        variables.conversationId,
        variables.slug,
      ]);

      queryClient.setQueryData<GetConversationsResponseType>(
        conversationKeys.list(),
        (old) => {
          if (!old) return old;
          const next = old.map((conv) =>
            conv.id === message.conversationId
              ? {
                  ...conv,
                  lastMessage: {
                    id: message.id,
                    senderId: message.senderId,
                    message: message.message,
                    fileUrl: message.fileUrl,
                    fileName: message.fileName,
                    fileSize: message.fileSize,
                    fileType: message.fileType,
                    isRead: message.isRead,
                    createdAt: message.createdAt,
                  },
                }
              : conv,
          );
          return sortByLastMessage(next);
        },
      );

      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

/**
 * Upload file để đính kèm vào tin nhắn trong hội thoại.
 * Sau khi upload thành công, client gửi tin nhắn kèm attachment qua socket/REST.
 */
export function useUploadConversationFile() {
  const extractData = useApiDataExtractor("chat");

  return useMutation({
    mutationFn: ({
      conversationId,
      file,
    }: {
      conversationId: number | string;
      file: File;
    }) =>
      conversationApiRequest
        .uploadFile(conversationId, file)
        .then(extractData),
  });
}

/**
 * Đánh dấu tin nhắn đã đọc bằng REST.
 */
export function useMarkConversationRead() {
  const extractData = useApiDataExtractor("chat");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: number | string) =>
      conversationApiRequest.markAsRead(conversationId).then(extractData),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(conversationId),
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Tạo hội thoại mới với 1 user.
 */
export function useCreateConversation() {
  const extractData = useApiDataExtractor("chat");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (participantId: number) =>
      conversationApiRequest
        .createConversation({ participantId })
        .then(extractData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

/**
 * Xóa/ẩn hội thoại về phía user hiện tại (soft delete).
 */
export function useHideConversation() {
  const extractData = useApiDataExtractor("chat");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: number | string) =>
      conversationApiRequest.hideConversation(conversationId).then(extractData),
    onSuccess: (_data, conversationId) => {
      // Xóa conversation khỏi cache danh sách ngay lập tức
      queryClient.setQueryData<GetConversationsResponseType>(
        conversationKeys.list(),
        (old) => {
          if (!old) return old;
          return old.filter(
            (c) =>
              c.id !== Number(conversationId) &&
              c.slug !== String(conversationId),
          );
        },
      );
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

/**
 * Xóa mềm tin nhắn của bản thân (soft delete).
 */
export function useDeleteConversationMessage() {
  const extractData = useApiDataExtractor("chat");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
    }: {
      conversationId: number | string;
      slug?: string;
      messageId: number;
    }) =>
      conversationApiRequest
        .deleteMessage(conversationId, messageId)
        .then(extractData),
    onSuccess: (_data, { conversationId, slug, messageId }) => {
      removeMessageFromConversationCaches(
        queryClient,
        conversationId,
        messageId,
        [slug],
      );
      void queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

/**
 * Ghim/bỏ ghim hội thoại về phía user hiện tại.
 */
export function usePinConversation() {
  const extractData = useApiDataExtractor("chat");
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      pinned,
    }: {
      conversationId: number | string;
      pinned: boolean;
    }) =>
      conversationApiRequest
        .pinConversation(conversationId, { pinned })
        .then(extractData),
    onSuccess: (data) => {
      // Cập nhật trạng thái pin + sắp xếp lại danh sách
      queryClient.setQueryData<GetConversationsResponseType>(
        conversationKeys.list(),
        (old) => {
          if (!old) return old;
          const next = old.map((c) =>
            c.id === data.id ? { ...c, pinnedAt: data.pinnedAt } : c,
          );
          return sortByLastMessage(next);
        },
      );
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

/**
 * Kết nối socket.io để chat realtime.
 *
 * - Nhận `message:new` → thêm tin nhắn vào cache messages.
 * - Nhận `conversation:updated` → cập nhật item trong danh sách hội thoại
 *   (reorder + unread count + last message preview) và refetch messages.
 */
export function useConversationSocket(
  socketUrl: string,
  token: string | null,
  currentUserId: number | null,
): { socket: Socket | null; connected: boolean } {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socketUrl || !currentUserId) {
      return;
    }

    let cancelled = false;
    let activeToken = token;
    let refreshedOnReject = false;

    const socketInstance = io(`${socketUrl}/conversations`, {
      transports: ["websocket", "polling"],
      autoConnect: false,
      auth: (cb) => {
        cb({ token: activeToken ?? "" });
      },
    });

    const connectWithFreshTokenIfNeeded = async (forceRefresh: boolean) => {
      if (forceRefresh || !activeToken) {
        const fresh = await fetchFreshSocketToken();
        if (cancelled) return;
        if (fresh) {
          activeToken = fresh;
        }
      }
      if (!cancelled && activeToken && !socketInstance.connected) {
        socketInstance.connect();
      }
    };

    socketInstance.on("connect", () => {
      refreshedOnReject = false;
      setConnected(true);
    });
    socketInstance.on("disconnect", (reason) => {
      setConnected(false);
      // Nếu server ngắt kết nối (thường do accessToken hết hạn), thử làm mới token 1 lần
      if (reason === "io server disconnect" && !refreshedOnReject) {
        refreshedOnReject = true;
        void connectWithFreshTokenIfNeeded(true);
      }
    });
    socketInstance.on("connect_error", () => {
      setConnected(false);
      if (!refreshedOnReject) {
        refreshedOnReject = true;
        void connectWithFreshTokenIfNeeded(true);
      }
    });

    // Tin nhắn mới (cả tin mình gửi và người khác gửi)
    socketInstance.on(
      "message:new",
      (payload: { conversationId: number; message: DirectMessageType }) => {
        const { conversationId, message } = payload;
        appendMessageToConversationCaches(queryClient, message, [
          conversationId,
        ]);
      },
    );

    // Hội thoại thay đổi (có tin nhắn mới / đã đọc) → cập nhật danh sách realtime
    socketInstance.on(
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

        // Refetch messages để cập nhật trạng thái đã đọc
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

    // Tin nhắn bị xóa mềm → xóa khỏi cache messages
    socketInstance.on(
      "message:deleted",
      (payload: { conversationId: number; messageId: number }) => {
        const { conversationId, messageId } = payload;
        removeMessageFromConversationCaches(
          queryClient,
          conversationId,
          messageId,
        );
        void queryClient.invalidateQueries({
          queryKey: conversationKeys.list(),
        });
      },
    );

    // Hội thoại bị user ẩn/xóa về phía mình → xóa khỏi danh sách
    socketInstance.on(
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

    setSocket(socketInstance);
    void connectWithFreshTokenIfNeeded(!activeToken);

    return () => {
      cancelled = true;
      socketInstance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [socketUrl, token, currentUserId, queryClient]);

  return { socket, connected };
}

// Hook tiện ích: gửi tin nhắn realtime qua socket
export function useSendMessageViaSocket(
  socket: Socket | null,
  conversationId: number,
) {
  return useCallback(
    (message: string) => {
      if (!socket || !message.trim()) return;
      socket.emit("message:send", { conversationId, message });
    },
    [socket, conversationId],
  );
}

// Hook tiện ích: xóa tin nhắn realtime qua socket
export function useDeleteMessageViaSocket(
  socket: Socket | null,
  conversationId: number,
) {
  return useCallback(
    (messageId: number) => {
      if (!socket) return;
      socket.emit("message:delete", { conversationId, messageId });
    },
    [socket, conversationId],
  );
}
