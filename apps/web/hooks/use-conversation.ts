import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { conversationApiRequest } from "@/apiRequests/conversation";
import type { ApiResponse } from "@shared/types";
import type {
  ConversationListItemType,
  DirectMessageType,
  GetConversationsResponseType,
  GetMessagesResponseType,
  MessageAttachmentType,
} from "@shared/types";

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) {
    return response.data;
  }
  throw new Error("Unexpected API error response");
}

export const conversationKeys = {
  // Key gốc cho toàn bộ module hội thoại
  all: ["conversations"] as const,

  // Key cho danh sách hội thoại của user hiện tại
  list: () => ["conversations", "list"] as const,

  // Key cho danh sách tin nhắn của 1 hội thoại
  messages: (conversationId: number) =>
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

/**
 * Lấy danh sách hội thoại của user hiện tại.
 * Mỗi hội thoại kèm tin nhắn cuối (preview) và số tin nhắn chưa đọc.
 */
export function useConversations(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: conversationKeys.list(),
    queryFn: () =>
      conversationApiRequest.getConversations().then(extractData),
    staleTime: 30 * 1000,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Lấy danh sách tin nhắn của 1 hội thoại.
 */
export function useConversationMessages(conversationId: number) {
  return useQuery({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: () =>
      conversationApiRequest
        .getMessages(conversationId)
        .then(extractData),
    enabled: conversationId > 0,
    staleTime: 15 * 1000,
  });
}

/**
 * Gửi tin nhắn bằng REST (fallback khi socket không hoạt động).
 */
export function useSendConversationMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      message,
      attachment,
    }: {
      conversationId: number;
      message: string;
      attachment?: MessageAttachmentType;
    }) =>
      conversationApiRequest
        .sendMessage(conversationId, message, attachment)
        .then(extractData),

    onSuccess: (message, variables) => {
      queryClient.setQueryData<GetMessagesResponseType>(
        conversationKeys.messages(variables.conversationId),
        (old) => {
          if (!old) return old;
          if (old.some((m) => m.id === message.id)) return old;
          return [...old, message];
        },
      );
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

/**
 * Upload file để đính kèm vào tin nhắn trong hội thoại.
 * Sau khi upload thành công, client gửi tin nhắn kèm attachment qua socket/REST.
 */
export function useUploadConversationFile() {
  return useMutation({
    mutationFn: ({
      conversationId,
      file,
    }: {
      conversationId: number;
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: number) =>
      conversationApiRequest.markAsRead(conversationId).then(extractData),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.messages(conversationId),
      });
    },
  });
}

/**
 * Tạo hội thoại mới với 1 user.
 */
export function useCreateConversation() {
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: number) =>
      conversationApiRequest.hideConversation(conversationId).then(extractData),
    onSuccess: (_data, conversationId) => {
      // Xóa conversation khỏi cache danh sách ngay lập tức
      queryClient.setQueryData<GetConversationsResponseType>(
        conversationKeys.list(),
        (old) => {
          if (!old) return old;
          return old.filter((c) => c.id !== conversationId);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
    }: {
      conversationId: number;
      messageId: number;
    }) =>
      conversationApiRequest
        .deleteMessage(conversationId, messageId)
        .then(extractData),
    onSuccess: (_data, { conversationId, messageId }) => {
      // Xóa tin nhắn khỏi cache messages ngay lập tức
      queryClient.setQueryData<GetMessagesResponseType>(
        conversationKeys.messages(conversationId),
        (old) => {
          if (!old) return old;
          return old.filter((m) => m.id !== messageId);
        },
      );
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });
}

/**
 * Ghim/bỏ ghim hội thoại về phía user hiện tại.
 */
export function usePinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      pinned,
    }: {
      conversationId: number;
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
    if (!socketUrl || !token || !currentUserId) {
      return;
    }

    const socketInstance = io(`${socketUrl}/conversations`, {
      transports: ["websocket"],
      auth: { token },
    });

    socketInstance.on("connect", () => setConnected(true));
    socketInstance.on("disconnect", () => setConnected(false));

    // Tin nhắn mới (cả tin mình gửi và người khác gửi)
    socketInstance.on(
      "message:new",
      (payload: { conversationId: number; message: DirectMessageType }) => {
        const { conversationId, message } = payload;

        queryClient.setQueryData<GetMessagesResponseType>(
          conversationKeys.messages(conversationId),
          (old) => {
            if (!old) return old;
            if (old.some((m) => m.id === message.id)) return old;
            return [...old, message];
          },
        );
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
        queryClient.invalidateQueries({
          queryKey: conversationKeys.messages(item.id),
        });
      },
    );

    // Tin nhắn bị xóa mềm → xóa khỏi cache messages
    socketInstance.on(
      "message:deleted",
      (payload: { conversationId: number; messageId: number }) => {
        const { conversationId, messageId } = payload;

        queryClient.setQueryData<GetMessagesResponseType>(
          conversationKeys.messages(conversationId),
          (old) => {
            if (!old) return old;
            return old.filter((m) => m.id !== messageId);
          },
        );

        queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
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

    return () => {
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
