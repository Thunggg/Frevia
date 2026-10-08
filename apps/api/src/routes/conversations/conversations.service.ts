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
  ConversationAccessDeniedException,
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

  // Lấy 1 conversation item chuẩn (dùng cho realtime update qua socket)
  async getConversationItem(
    conversationId: number,
    userId: number,
  ): Promise<ConversationListItemType | null> {
    const all =
      await this.conversationRepository.getConversationsByUserId(userId);
    const conversation = all.find((item) => item.id === conversationId);
    return conversation
      ? this.buildConversationItem(conversation, userId)
      : null;
  }

  // Lấy danh sách tin nhắn của 1 conversation (chỉ participant được xem)
  async getMessages(
    userId: number,
    conversationId: number,
  ): Promise<DirectMessageType[]> {
    try {
      const conversation =
        await this.conversationRepository.findConversationByIdForUser(
          conversationId,
          userId,
        );

      if (!conversation) {
        throw ConversationNotFoundException();
      }

      return await this.conversationRepository.getMessages(conversationId);
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
          participant1: existing.participant1,
          participant2: existing.participant2,
          createdAt: existing.createdAt,
        };
      }

      return await this.conversationRepository.createConversation(
        userId,
        participantId,
      );
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
    conversationId: number,
    message: string,
    attachment?: MessageAttachmentType | null,
  ): Promise<DirectMessageType> {
    try {
      const conversation =
        await this.conversationRepository.findConversationByIdForUser(
          conversationId,
          userId,
        );

      if (!conversation) {
        throw ConversationNotFoundException();
      }

      const savedMessage = await this.conversationRepository.createMessage(
        conversationId,
        userId,
        message,
        attachment ?? undefined,
      );

      // Có tin nhắn mới => bỏ ẩn conversation cho cả 2 phía
      await this.conversationRepository.unhideConversation(conversationId);

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
    conversationId: number,
    file?: Express.Multer.File,
  ): Promise<MessageAttachmentType> {
    try {
      if (!file) {
        throw FailedToUploadFileException();
      }

      const conversation =
        await this.conversationRepository.findConversationByIdForUser(
          conversationId,
          userId,
        );

      if (!conversation) {
        throw ConversationNotFoundException();
      }

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
        `Failed to upload file (conversation ${conversationId}): ${(error as Error).message}`,
      );
      throw FailedToUploadFileException();
    }
  }

  // Xóa mềm tin nhắn của bản thân (chỉ sender được xóa tin của mình)
  async deleteMessage(
    userId: number,
    conversationId: number,
    messageId: number,
  ): Promise<{ id: number }> {
    try {
      const conversation =
        await this.conversationRepository.findConversationByIdForUser(
          conversationId,
          userId,
        );

      if (!conversation) {
        throw ConversationNotFoundException();
      }

      const deleted = await this.conversationRepository.softDeleteMessage(
        conversationId,
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
    conversationId: number,
  ): Promise<{ count: number }> {
    try {
      const conversation =
        await this.conversationRepository.findConversationByIdForUser(
          conversationId,
          userId,
        );

      if (!conversation) {
        throw ConversationNotFoundException();
      }

      const result = await this.conversationRepository.markMessagesAsRead(
        conversationId,
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
    conversationId: number,
  ): Promise<{ id: number; hidden: boolean }> {
    try {
      const conversation =
        await this.conversationRepository.findConversationByIdForUser(
          conversationId,
          userId,
        );

      if (!conversation) {
        throw ConversationNotFoundException();
      }

      const hidden = await this.conversationRepository.hideConversationForUser(
        conversationId,
        userId,
      );

      return { id: conversationId, hidden };
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
    conversationId: number,
    pinned: boolean,
  ): Promise<{ id: number; pinnedAt: Date | null }> {
    try {
      const conversation =
        await this.conversationRepository.findConversationByIdForUser(
          conversationId,
          userId,
        );

      if (!conversation) {
        throw ConversationNotFoundException();
      }

      const pinnedAt = await this.conversationRepository.setPinnedForUser(
        conversationId,
        userId,
        pinned,
      );

      return { id: conversationId, pinnedAt };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw FailedToPinConversationException();
    }
  }

  // Kiểm tra user có phải participant của conversation không
  async ensureParticipant(conversationId: number, userId: number) {
    const conversation =
      await this.conversationRepository.findConversationByIdForUser(
        conversationId,
        userId,
      );

    if (!conversation) {
      throw ConversationAccessDeniedException();
    }

    return conversation;
  }
}
