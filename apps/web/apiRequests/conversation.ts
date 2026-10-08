import {
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

  // Tạo mới hội thoại (hoặc trả về hội thoại đã tồn tại với user)
  createConversation: (data: CreateConversationBodyType) =>
    http.post<CreateConversationResponseType>("/api/conversations", data),

  // Lấy danh sách tin nhắn của 1 hội thoại
  getMessages: (conversationId: number) =>
    http.get<GetMessagesResponseType>(
      `/api/conversations/${conversationId}/messages`,
    ),

  // Gửi tin nhắn (REST fallback), có thể kèm file đã upload
  sendMessage: (
    conversationId: number,
    message: string,
    attachment?: MessageAttachmentType,
  ) =>
    http.post<SendMessageResponseType>(
      `/api/conversations/${conversationId}/messages`,
      attachment ? { message, attachment } : { message },
    ),

  // Upload file để đính kèm vào tin nhắn (multipart/form-data)
  uploadFile: (conversationId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return fetch(`/api/backend/api/conversations/${conversationId}/files`, {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      const data: ApiResponse<UploadConversationFileResponseType> =
        await res.json();
      if (!res.ok) {
        throw new ApiFail(data as ApiError, res.status);
      }
      return data;
    });
  },

  // Đánh dấu tin nhắn đã đọc
  markAsRead: (conversationId: number) =>
    http.patch<{ count: number }>(`/api/conversations/${conversationId}/read`, {}),

  // Xóa/ẩn hội thoại về phía user hiện tại (soft delete)
  hideConversation: (conversationId: number) =>
    http.patch<HideConversationResponseType>(
      `/api/conversations/${conversationId}/hide`,
      {},
    ),

  // Ghim/bỏ ghim hội thoại về phía user hiện tại
  pinConversation: (conversationId: number, body: PinConversationBodyType) =>
    http.patch<PinConversationResponseType>(
      `/api/conversations/${conversationId}/pin`,
      body,
    ),

  // Xóa mềm tin nhắn của bản thân (soft delete)
  deleteMessage: (conversationId: number, messageId: number) =>
    http.delete<DeleteMessageResponseType>(
      `/api/conversations/${conversationId}/messages/${messageId}`,
    ),
};
