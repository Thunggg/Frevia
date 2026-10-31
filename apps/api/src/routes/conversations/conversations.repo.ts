import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { DirectMessage, Conversation } from '@prisma/client';
import { MessageAttachmentType } from '@shared/types';

@Injectable()
export class ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Tìm conversation giữa 2 user (không phân biệt thứ tự participant)
  async findConversationBetween(
    userId1: number,
    userId2: number,
  ): Promise<Conversation | null> {
    return this.prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1: userId1, participant2: userId2 },
          { participant1: userId2, participant2: userId1 },
        ],
        deletedAt: null,
      },
    });
  }

  // Lấy tất cả conversations của 1 user, kèm last message + unread count.
  // Loại bỏ những conversation đã bị user ẩn/xóa về phía mình.
  async getConversationsByUserId(userId: number) {
    return this.prisma.conversation.findMany({
      where: {
        deletedAt: null,
        OR: [
          { participant1: userId, participant1HiddenAt: null },
          { participant2: userId, participant2HiddenAt: null },
        ],
      },
      include: {
        participantOne: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        participantTwo: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        // Tin nhắn cuối cùng của conversation (preview)
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            senderId: true,
            message: true,
            fileUrl: true,
            fileName: true,
            fileSize: true,
            fileType: true,
            isRead: true,
            createdAt: true,
          },
        },
        // Số tin nhắn chưa đọc của current user (người khác gửi, chưa đọc)
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: userId },
                isRead: false,
                deletedAt: null,
              },
            },
          },
        },
      },
    });
  }

  // Lấy conversation theo id, chỉ khi user là participant
  async findConversationByIdForUser(
    conversationId: number,
    userId: number,
  ): Promise<Conversation | null> {
    return this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        deletedAt: null,
        OR: [{ participant1: userId }, { participant2: userId }],
      },
    });
  }

  // Lấy conversation theo id (không kiểm tra quyền)
  async findConversationById(
    conversationId: number,
  ): Promise<Conversation | null> {
    return this.prisma.conversation.findFirst({
      where: { id: conversationId, deletedAt: null },
    });
  }

  // Ẩn/xóa conversation về phía 1 user (soft delete: chỉ ẩn ở phía user đó)
  async hideConversationForUser(
    conversationId: number,
    userId: number,
  ): Promise<boolean> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participant1: true, participant2: true },
    });

    if (!conversation) {
      return false;
    }

    if (conversation.participant1 === userId) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { participant1HiddenAt: new Date() },
      });
    } else if (conversation.participant2 === userId) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { participant2HiddenAt: new Date() },
      });
    } else {
      return false;
    }

    return true;
  }

  // Bỏ ẩn conversation cho cả 2 phía (khi có hoạt động mới như gửi tin nhắn)
  async unhideConversation(conversationId: number) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { participant1HiddenAt: null, participant2HiddenAt: null },
    });
  }

  // Ghim/bỏ ghim conversation về phía 1 user. Trả về pinnedAt hiện tại (null nếu bỏ ghim).
  async setPinnedForUser(
    conversationId: number,
    userId: number,
    pinned: boolean,
  ): Promise<Date | null> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { participant1: true, participant2: true },
    });

    if (!conversation) {
      return null;
    }

    const now = pinned ? new Date() : null;

    if (conversation.participant1 === userId) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { participant1PinnedAt: now },
      });
    } else if (conversation.participant2 === userId) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { participant2PinnedAt: now },
      });
    } else {
      return null;
    }

    return now;
  }

  // Lấy tất cả tin nhắn của conversation theo thứ tự thời gian
  async getMessages(conversationId: number): Promise<DirectMessage[]> {
    return this.prisma.directMessage.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createConversation(
    participant1: number,
    participant2: number,
  ): Promise<Conversation> {
    return this.prisma.conversation.create({
      data: { participant1, participant2 },
    });
  }

  async createMessage(
    conversationId: number,
    senderId: number,
    message: string,
    attachment?: MessageAttachmentType,
  ): Promise<DirectMessage> {
    return this.prisma.directMessage.create({
      data: {
        conversationId,
        senderId,
        message,
        fileUrl: attachment?.fileUrl ?? null,
        fileName: attachment?.fileName ?? null,
        fileSize: attachment?.fileSize ?? null,
        fileType: attachment?.fileType ?? null,
      },
    });
  }

  // Xóa mềm tin nhắn (soft delete). Chỉ sender của tin nhắn mới được xóa.
  // Trả về true nếu xóa thành công, false nếu tin nhắn không tồn tại,
  // đã bị xóa trước đó hoặc không phải của sender.
  async softDeleteMessage(
    conversationId: number,
    messageId: number,
    senderId: number,
  ): Promise<boolean> {
    const result = await this.prisma.directMessage.updateMany({
      where: {
        id: messageId,
        conversationId,
        senderId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });

    return result.count > 0;
  }

  // Đánh dấu tất cả tin nhắn chưa đọc (người khác gửi) là đã đọc
  async markMessagesAsRead(conversationId: number, userId: number) {
    return this.prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
        deletedAt: null,
      },
      data: { isRead: true },
    });
  }

  // Đếm số tin nhắn chưa đọc của current user
  async countUnread(conversationId: number, userId: number): Promise<number> {
    return this.prisma.directMessage.count({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
        deletedAt: null,
      },
    });
  }
}
