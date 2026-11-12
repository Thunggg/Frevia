import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConversationRepository } from './conversations.repo';
import {
  ConversationListItemType,
  DirectMessageType,
  GetConversationsResponseType,
  MessageAttachmentType,
} from '@shared/types';
import {
  CannotStartConversationWithSelfException,
  ConversationNotFoundException,
  FailedToCreateConversationException,
  FailedToDeleteMessageException,
  FailedToHideConversationException,
  FailedToLoadConversationsException,
  FailedToMarkAsReadException,
  FailedToPinConversationException,
  FailedToSendMessageException,
  FailedToUploadFileException,
  MessageNotFoundException,
} from './conversations.error';
import { uploadConversationFile } from './conversation-file.storage';

// Kiểu dữ liệu thô trả về từ repo (kèm participant + last message + unread count)
type RawConversationItem = {
  id: number;
  slug: string;
  participant1: number;
  participant2: number;
  createdAt: Date;
  participant1PinnedAt: Date | null;
  participant2PinnedAt: Date | null;
  participantOne: {
    id: number;
    profile: { displayName: string | null; avatarUrl: string | null } | null;
  };
  participantTwo: {
    id: number;
    profile: { displayName: string | null; avatarUrl: string | null } | null;
  };
  messages: {
    id: number;
    senderId: number;
    message: string;
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    fileType: string | null;
    isRead: boolean;
    createdAt: Date;
  }[];
  _count: { messages: number };
};

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  // Map 1 conversation raw thành item chuẩn cho response
  private buildConversationItem(
    conversation: RawConversationItem,
    userId: number,
  ): ConversationListItemType {
    const otherUser =
      conversation.participant1 === userId
        ? conversation.participantTwo
        : conversation.participantOne;

    const lastMessage = conversation.messages[0] ?? null;

    return {
      id: conversation.id,
      slug: conversation.slug,
      participant1: conversation.participant1,
      participant2: conversation.participant2,
      createdAt: conversation.createdAt,
      otherUser: {
        id: otherUser.id,
        profile: otherUser.profile,
      },
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            senderId: lastMessage.senderId,
            message: lastMessage.message,
            fileUrl: lastMessage.fileUrl,
            fileName: lastMessage.fileName,
            fileSize: lastMessage.fileSize,
            fileType: lastMessage.fileType,
            isRead: lastMessage.isRead,
            createdAt: lastMessage.createdAt,
          }
        : null,
      unreadCount: conversation._count.messages,
      pinnedAt:
        conversation.participant1 === userId
          ? conversation.participant1PinnedAt
          : conversation.participant2PinnedAt,
    };
  }

  // Lấy tất cả conversations của user hiện tại,
  // mỗi conversation kèm tin nhắn cuối (preview) và số tin nhắn chưa đọc.
  // Sắp xếp theo tin nhắn cuối mới nhất.
  async getConversations(
    userId: number,
  ): Promise<GetConversationsResponseType> {
    try {
      const conversations =
        await this.conversationRepository.getConversationsByUserId(userId);

      return conversations
        .map((conversation) => this.buildConversationItem(conversation, userId))
        .sort((a, b) => {
          // Hội thoại đã ghim xếp trên, trong nhóm ghim sắp theo thời gian ghim
          if (a.pinnedAt && b.pinnedAt) {
            return b.pinnedAt.getTime() - a.pinnedAt.getTime();
          }
          if (a.pinnedAt) return -1;
          if (b.pinnedAt) return 1;

          const aTime =
            a.lastMessage?.createdAt.getTime() ?? a.createdAt.getTime();
          const bTime =
            b.lastMessage?.createdAt.getTime() ?? b.createdAt.getTime();
          return bTime - aTime;
        });
    } catch {
      throw FailedToLoadConversationsException();
    }
  }

  // Lấy 1 conversation item chuẩn (dùng cho realtime update qua socket hoặc query theo id/slug)
  async getConversationItem(
    conversationIdOrSlug: number | string,
    userId: number,
  ): Promise<ConversationListItemType | null> {
    const all =
      await this.conversationRepository.getConversationsByUserId(userId);
    const conversation = all.find(
      (item) =>
        item.id === Number(conversationIdOrSlug) ||
        item.slug === String(conversationIdOrSlug),
    );
    return conversation
      ? this.buildConversationItem(conversation, userId)
      : null;
  }

  // Lấy chi tiết 1 conversation theo id hoặc slug
  async getConversationDetail(
    userId: number,
    conversationIdOrSlug: number | string,
  ): Promise<ConversationListItemType> {
    const item = await this.getConversationItem(conversationIdOrSlug, userId);
    if (!item) {
      throw ConversationNotFoundException();
    }
    return item;
  }

  // Lấy danh sách tin nhắn của 1 conversation (chỉ participant được xem)
  async getMessages(
    userId: number,
    conversationIdOrSlug: number | string,
  ): Promise<DirectMessageType[]> {
    try {
      const conversation = await this.ensureParticipant(
        conversationIdOrSlug,
        userId,
      );

      return await this.conversationRepository.getMessages(conversation.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToLoadConversationsException();
    }
  }

  // Tạo mới conversation (hoặc trả về conversation đã tồn tại)
  async createConversation(
    userId: number,
    participantId: number,
  ): Promise<{
    id: number;
    slug: string;
    participant1: number;
    participant2: number;
    createdAt: Date;
  }> {
    try {
      if (participantId === userId) {
        throw CannotStartConversationWithSelfException();
      }

      const existing =
        await this.conversationRepository.findConversationBetween(
          userId,
          participantId,
        );

      if (existing) {
        // Bỏ ẩn lại nếu conversation từng bị 1 trong 2 phía ẩn (có hoạt động mới)
        await this.conversationRepository.unhideConversation(existing.id);

        return {
          id: existing.id,
          slug: existing.slug,
          participant1: existing.participant1,
          participant2: existing.participant2,
          createdAt: existing.createdAt,
        };
      }

      const created = await this.conversationRepository.createConversation(
        userId,
        participantId,
      );

      return {
        id: created.id,
        slug: created.slug,
        participant1: created.participant1,
        participant2: created.participant2,
        createdAt: created.createdAt,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToCreateConversationException();
    }
  }

  // Gửi tin nhắn (dùng cho REST; realtime dùng gateway)
  async sendMessage(
    userId: number,
    conversationIdOrSlug: number | string,
    message: string,
    attachment?: MessageAttachmentType | null,
  ): Promise<DirectMessageType> {
    try {
      const conversation = await this.ensureParticipant(
        conversationIdOrSlug,
        userId,
      );

      const savedMessage = await this.conversationRepository.createMessage(
        conversation.id,
        userId,
        message,
        attachment ?? undefined,
      );

      // Có tin nhắn mới => bỏ ẩn conversation cho cả 2 phía
      await this.conversationRepository.unhideConversation(conversation.id);

      return savedMessage;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToSendMessageException();
    }
  }

  // Upload file để đính kèm vào tin nhắn (chỉ participant của hội thoại mới được upload)
  async uploadFile(
    userId: number,
    conversationIdOrSlug: number | string,
    file?: Express.Multer.File,
  ): Promise<MessageAttachmentType> {
    try {
      if (!file) {
        throw FailedToUploadFileException();
      }

      await this.ensureParticipant(conversationIdOrSlug, userId);

      // Upload lên Cloudinary -> fileUrl là URL https trực tiếp
      const { secureUrl, bytes } = await uploadConversationFile(file);

      return {
        fileUrl: secureUrl,
        fileName: file.originalname,
        fileSize: bytes,
        fileType: file.mimetype,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Failed to upload file (conversation ${conversationIdOrSlug}): ${(error as Error).message}`,
      );
      throw FailedToUploadFileException();
    }
  }

  // Xóa mềm tin nhắn của bản thân (chỉ sender được xóa tin của mình)
  async deleteMessage(
    userId: number,
    conversationIdOrSlug: number | string,
    messageId: number,
  ): Promise<{ id: number }> {
    try {
      const conversation = await this.ensureParticipant(
        conversationIdOrSlug,
        userId,
      );

      const deleted = await this.conversationRepository.softDeleteMessage(
        conversation.id,
        messageId,
        userId,
      );

      if (!deleted) {
        throw MessageNotFoundException();
      }

      return { id: messageId };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToDeleteMessageException();
    }
  }

  // Đánh dấu tin nhắn đã đọc
  async markAsRead(
    userId: number,
    conversationIdOrSlug: number | string,
  ): Promise<{ count: number }> {
    try {
      const conversation = await this.ensureParticipant(
        conversationIdOrSlug,
        userId,
      );

      const result = await this.conversationRepository.markMessagesAsRead(
        conversation.id,
        userId,
      );

      return { count: result.count };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToMarkAsReadException();
    }
  }

  // Ẩn/xóa conversation về phía user hiện tại (soft delete)
  async hideConversation(
    userId: number,
    conversationIdOrSlug: number | string,
  ): Promise<{ id: number; hidden: boolean }> {
    try {
      const conversation = await this.ensureParticipant(
        conversationIdOrSlug,
        userId,
      );

      const hidden = await this.conversationRepository.hideConversationForUser(
        conversation.id,
        userId,
      );

      return { id: conversation.id, hidden };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToHideConversationException();
    }
  }

  // Ghim/bỏ ghim hội thoại về phía user hiện tại
  async pinConversation(
    userId: number,
    conversationIdOrSlug: number | string,
    pinned: boolean,
  ): Promise<{ id: number; pinnedAt: Date | null }> {
    try {
      const conversation = await this.ensureParticipant(
        conversationIdOrSlug,
        userId,
      );

      const pinnedAt = await this.conversationRepository.setPinnedForUser(
        conversation.id,
        userId,
        pinned,
      );

      return { id: conversation.id, pinnedAt };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToPinConversationException();
    }
  }

  // Kiểm tra user có phải participant của conversation không
  async ensureParticipant(
    conversationIdOrSlug: number | string,
    userId: number,
  ) {
    const isNumeric =
      typeof conversationIdOrSlug === 'number' ||
      (/^\d+$/.test(conversationIdOrSlug) &&
        Number.isSafeInteger(Number(conversationIdOrSlug)));

    const conversation = isNumeric
      ? await this.conversationRepository.findConversationByIdForUser(
          Number(conversationIdOrSlug),
          userId,
        )
      : await this.conversationRepository.findConversationBySlugForUser(
          String(conversationIdOrSlug),
          userId,
        );

    if (!conversation) {
      throw ConversationNotFoundException();
    }

    return conversation;
  }
}
