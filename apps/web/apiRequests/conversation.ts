import {
  ConversationListItemType,
  CreateConversationBodyType,
  CreateConversationResponseType,
  DeleteMessageResponseType,
  GetConversationsResponseType,
  GetMessagesResponseType,
  HideConversationResponseType,
  MessageAttachmentType,
  PinConversationBodyType,
  PinConversationResponseType,
  SendMessageResponseType,
  UploadConversationFileResponseType,
  type ApiError,
  type ApiResponse,
} from "@shared/types";
import { ApiFail, http } from "@/lib/http";

export const conversationApiRequest = {
  // Lấy danh sách hội thoại của user hiện tại (kèm last message + unread count)
  getConversations: () =>
    http.get<GetConversationsResponseType>("/api/conversations"),

  // Lấy thông tin chi tiết 1 hội thoại theo id hoặc slug
  getConversation: (conversationIdOrSlug: number | string) =>
    http.get<ConversationListItemType>(
      `/api/conversations/${conversationIdOrSlug}`,
    ),

  // Tạo mới hội thoại (hoặc trả về hội thoại đã tồn tại với user)
  createConversation: (data: CreateConversationBodyType) =>
    http.post<CreateConversationResponseType>("/api/conversations", data),

  // Lấy danh sách tin nhắn của 1 hội thoại
  getMessages: (conversationIdOrSlug: number | string) =>
    http.get<GetMessagesResponseType>(
      `/api/conversations/${conversationIdOrSlug}/messages`,
    ),

  // Gửi tin nhắn (REST fallback), có thể kèm file đã upload
  sendMessage: (
    conversationIdOrSlug: number | string,
    message: string,
    attachment?: MessageAttachmentType,
  ) =>
    http.post<SendMessageResponseType>(
      `/api/conversations/${conversationIdOrSlug}/messages`,
      attachment ? { message, attachment } : { message },
    ),

  // Upload file để đính kèm vào tin nhắn (multipart/form-data)
  uploadFile: (conversationIdOrSlug: number | string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return fetch(
      `/api/backend/api/conversations/${conversationIdOrSlug}/files`,
      {
        method: "POST",
        body: formData,
      },
    ).then(async (res) => {
      const data: ApiResponse<UploadConversationFileResponseType> =
        await res.json();
      if (!res.ok) {
        throw new ApiFail(data as ApiError, res.status);
      }
      return data;
    });
  },

  // Đánh dấu tin nhắn đã đọc
  markAsRead: (conversationIdOrSlug: number | string) =>
    http.patch<{ count: number }>(
      `/api/conversations/${conversationIdOrSlug}/read`,
      {},
    ),

  // Xóa/ẩn hội thoại về phía user hiện tại (soft delete)
  hideConversation: (conversationIdOrSlug: number | string) =>
    http.patch<HideConversationResponseType>(
      `/api/conversations/${conversationIdOrSlug}/hide`,
      {},
    ),

  // Ghim/bỏ ghim hội thoại về phía user hiện tại
  pinConversation: (
    conversationIdOrSlug: number | string,
    body: PinConversationBodyType,
  ) =>
    http.patch<PinConversationResponseType>(
      `/api/conversations/${conversationIdOrSlug}/pin`,
      body,
    ),

  // Xóa mềm tin nhắn của bản thân (soft delete)
  deleteMessage: (conversationIdOrSlug: number | string, messageId: number) =>
    http.delete<DeleteMessageResponseType>(
      `/api/conversations/${conversationIdOrSlug}/messages/${messageId}`,
    ),
};
