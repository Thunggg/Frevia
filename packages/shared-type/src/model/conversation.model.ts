import { z } from "zod";

// Schema cho DirectMessage model
export const DirectMessageSchema = z.object({
  id: z.number(),
  conversationId: z.number(),
  senderId: z.number(),
  message: z.string(),
  fileUrl: z.string().nullable(),
  fileName: z.string().nullable(),
  fileSize: z.number().nullable(),
  fileType: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type DirectMessageType = z.infer<typeof DirectMessageSchema>;

// Metadata của 1 file đính kèm vào tin nhắn
export const MessageAttachmentSchema = z.object({
  fileUrl: z.string(),
  fileName: z.string(),
  fileSize: z.number().nullable(),
  fileType: z.string().nullable(),
});

export type MessageAttachmentType = z.infer<typeof MessageAttachmentSchema>;

// Response cho POST /conversations/:id/files (upload file trong hội thoại)
export const UploadConversationFileResponseSchema = MessageAttachmentSchema;

export type UploadConversationFileResponseType = z.infer<
  typeof UploadConversationFileResponseSchema
>;

// Schema cho Conversation model
export const ConversationSchema = z.object({
  id: z.number(),
  participant1: z.number(),
  participant2: z.number(),
  createdAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type ConversationType = z.infer<typeof ConversationSchema>;

// Mỗi item trong danh sách hội thoại:
// - otherUser: thông tin người còn lại trong cuộc hội thoại
// - lastMessage: tin nhắn cuối cùng (preview)
// - unreadCount: số tin nhắn chưa đọc của current user
// - pinnedAt: thời điểm user hiện tại ghim hội thoại (null nếu chưa ghim)
export const ConversationListItemSchema = z.object({
  id: z.number(),
  participant1: z.number(),
  participant2: z.number(),
  createdAt: z.date(),
  otherUser: z.object({
    id: z.number(),
    profile: z
      .object({
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
      })
      .nullable(),
  }),
  lastMessage: z
    .object({
      id: z.number(),
      senderId: z.number(),
      message: z.string(),
      fileUrl: z.string().nullable(),
      fileName: z.string().nullable(),
      fileSize: z.number().nullable(),
      fileType: z.string().nullable(),
      isRead: z.boolean(),
      createdAt: z.date(),
    })
    .nullable(),
  unreadCount: z.number(),
  pinnedAt: z.date().nullable(),
});

export type ConversationListItemType = z.infer<
  typeof ConversationListItemSchema
>;

// Response cho GET /conversations
export const GetConversationsResponseSchema = z.array(
  ConversationListItemSchema,
);

export type GetConversationsResponseType = z.infer<
  typeof GetConversationsResponseSchema
>;

// Response cho GET /conversations/:id/messages
export const GetMessagesResponseSchema = z.array(DirectMessageSchema);

export type GetMessagesResponseType = z.infer<typeof GetMessagesResponseSchema>;

// Body cho POST /conversations/:id/messages
export const SendMessageBodySchema = z
  .object({
    message: z.string().max(2000).default(""),
    attachment: MessageAttachmentSchema.optional(),
  })
  .refine((data) => data.message.length > 0 || Boolean(data.attachment), {
    message: "Message or attachment is required",
  });

export type SendMessageBodyType = z.infer<typeof SendMessageBodySchema>;

// Response cho POST /conversations/:id/messages
export const SendMessageResponseSchema = DirectMessageSchema;

export type SendMessageResponseType = z.infer<typeof SendMessageResponseSchema>;

// Body cho POST /conversations (tạo hoặc lấy hội thoại với người dùng khác)
export const CreateConversationBodySchema = z.object({
  participantId: z.number().int().positive(),
});

export type CreateConversationBodyType = z.infer<
  typeof CreateConversationBodySchema
>;

// Response cho POST /conversations
export const CreateConversationResponseSchema = ConversationSchema.pick({
  id: true,
  participant1: true,
  participant2: true,
  createdAt: true,
});

export type CreateConversationResponseType = z.infer<
  typeof CreateConversationResponseSchema
>;

// Response cho PATCH /conversations/:id/hide (xóa/ẩn hội thoại về phía user)
export const HideConversationResponseSchema = z.object({
  id: z.number(),
  hidden: z.boolean(),
});

export type HideConversationResponseType = z.infer<
  typeof HideConversationResponseSchema
>;

// Body cho PATCH /conversations/:id/pin (ghim/bỏ ghim hội thoại)
export const PinConversationBodySchema = z.object({
  pinned: z.boolean(),
});

export type PinConversationBodyType = z.infer<typeof PinConversationBodySchema>;

// Response cho DELETE /conversations/:id/messages/:messageId (xóa mềm tin nhắn)
export const DeleteMessageResponseSchema = z.object({
  id: z.number(),
});

export type DeleteMessageResponseType = z.infer<
  typeof DeleteMessageResponseSchema
>;

// Response cho PATCH /conversations/:id/pin
export const PinConversationResponseSchema = z.object({
  id: z.number(),
  pinnedAt: z.date().nullable(),
});

export type PinConversationResponseType = z.infer<
  typeof PinConversationResponseSchema
>;
