import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { z } from 'zod';
import { envConfig } from '../../shared/config/validate-env';
import { TokenService } from '../../shared/services/token.service';
import { ConversationService } from './conversations.service';
import { MessageAttachmentSchema } from '@shared/types';

const SendMessagePayloadSchema = z
  .object({
    conversationId: z.number().int().positive(),
    message: z.string().max(2000).default(''),
    attachment: MessageAttachmentSchema.optional(),
  })
  .refine((data) => data.message.length > 0 || Boolean(data.attachment), {
    message: 'Message or attachment is required',
  });

const MarkAsReadPayloadSchema = z.object({
  conversationId: z.number().int().positive(),
});

const HideConversationPayloadSchema = z.object({
  conversationId: z.number().int().positive(),
});

const DeleteMessagePayloadSchema = z.object({
  conversationId: z.number().int().positive(),
  messageId: z.number().int().positive(),
});

const TypingPayloadSchema = z.object({
  conversationId: z.number().int().positive(),
  isTyping: z.boolean(),
});

type SocketPayloadUser = { userId: number };

@Injectable()
@WebSocketGateway({
  namespace: 'conversations',
  cors: {
    origin: envConfig.NEXT_URL,
    credentials: true,
  },
})
export class ConversationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConversationsGateway.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly tokenService: TokenService,
  ) {}

  // Xác thực khi client kết nối bằng JWT access token, sau đó join room của user
  async handleConnection(client: Socket) {
    try {
      const authToken = client.handshake.auth?.token;
      const headerToken =
        client.handshake.headers?.authorization?.split(' ')[1];
      const token: string | undefined =
        typeof authToken === 'string' ? authToken : headerToken;

      if (!token) {
        throw new UnauthorizedException();
      }

      const payload = await this.tokenService.verifyAccessToken(token);
      client.data.userId = payload.userId;

      // Mỗi user có 1 room riêng: user:{userId}
      await client.join(`user:${payload.userId}`);

      this.logger.log(`Socket connected: user ${payload.userId}`);
    } catch (error) {
      this.logger.warn(
        `Socket connection rejected: ${(error as Error).message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `Socket disconnected: ${(client.data as SocketPayloadUser)?.userId ?? 'unknown'}`,
    );
  }

  // Gửi tin nhắn realtime
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ) {
    const senderId = (client.data as SocketPayloadUser).userId;

    if (!senderId) {
      return { success: false };
    }

    const parsed = SendMessagePayloadSchema.safeParse(payload);

    if (!parsed.success) {
      client.emit('message:error', {
        message: 'Invalid message payload',
        details: parsed.error.flatten(),
      });
      return { success: false };
    }

    const { conversationId, message, attachment } = parsed.data;

    try {
      const conversation = await this.conversationService.ensureParticipant(
        conversationId,
        senderId,
      );

      const savedMessage = await this.conversationService.sendMessage(
        senderId,
        conversationId,
        message,
        attachment,
      );

      const receiverId =
        conversation.participant1 === senderId
          ? conversation.participant2
          : conversation.participant1;

      // Gửi tin nhắn mới tới cả 2 người trong hội thoại
      this.server
        .to(`user:${senderId}`)
        .to(`user:${receiverId}`)
        .emit('message:new', {
          conversationId,
          message: savedMessage,
        });

      // Cập nhật danh sách hội thoại realtime (reorder + unread count)
      await this.emitConversationUpdated(conversationId, senderId);
      await this.emitConversationUpdated(conversationId, receiverId);

      return { success: true, message: savedMessage };
    } catch (error) {
      this.logger.error(`Failed to send message: ${(error as Error).message}`);
      client.emit('message:error', {
        message: 'Failed to send message',
      });
      return { success: false };
    }
  }

  // Đánh dấu tin nhắn đã đọc
  @SubscribeMessage('message:read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ) {
    const userId = (client.data as SocketPayloadUser).userId;

    if (!userId) {
      return { success: false };
    }

    const parsed = MarkAsReadPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return { success: false };
    }

    const { conversationId } = parsed.data;

    try {
      await this.conversationService.ensureParticipant(conversationId, userId);

      await this.conversationService.markAsRead(userId, conversationId);

      const conversation = await this.conversationService.ensureParticipant(
        conversationId,
        userId,
      );

      const otherUserId =
        conversation.participant1 === userId
          ? conversation.participant2
          : conversation.participant1;

      // Báo cho cả 2 phía để cập nhật trạng thái đã đọc + unread count
      await this.emitConversationUpdated(conversationId, userId);
      await this.emitConversationUpdated(conversationId, otherUserId);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to mark as read: ${(error as Error).message}`);
      return { success: false };
    }
  }

  // Xóa mềm tin nhắn (chỉ sender của tin nhắn mới được xóa)
  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ) {
    const userId = (client.data as SocketPayloadUser).userId;

    if (!userId) {
      return { success: false };
    }

    const parsed = DeleteMessagePayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return { success: false };
    }

    const { conversationId, messageId } = parsed.data;

    try {
      const conversation = await this.conversationService.ensureParticipant(
        conversationId,
        userId,
      );

      await this.conversationService.deleteMessage(
        userId,
        conversationId,
        messageId,
      );

      const otherUserId =
        conversation.participant1 === userId
          ? conversation.participant2
          : conversation.participant1;

      // Báo cho cả 2 phía để xóa tin nhắn khỏi màn hình
      this.server
        .to(`user:${userId}`)
        .to(`user:${otherUserId}`)
        .emit('message:deleted', {
          conversationId,
          messageId,
        });

      // Cập nhật danh sách hội thoại realtime (last message preview)
      await this.emitConversationUpdated(conversationId, userId);
      await this.emitConversationUpdated(conversationId, otherUserId);

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to delete message: ${(error as Error).message}`,
      );
      client.emit('message:error', {
        message: 'Failed to delete message',
      });
      return { success: false };
    }
  }

  // Ẩn/xóa hội thoại về phía user hiện tại (soft delete)
  @SubscribeMessage('conversation:hide')
  async handleHideConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ) {
    const userId = (client.data as SocketPayloadUser).userId;

    if (!userId) {
      return { success: false };
    }

    const parsed = HideConversationPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return { success: false };
    }

    const { conversationId } = parsed.data;

    try {
      await this.conversationService.ensureParticipant(conversationId, userId);

      await this.conversationService.hideConversation(userId, conversationId);

      // Báo cho chính user để xóa conversation khỏi danh sách ngay lập tức
      this.server.to(`user:${userId}`).emit('conversation:hidden', {
        conversationId,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Failed to hide conversation: ${(error as Error).message}`,
      );
      return { success: false };
    }
  }

  // Thông báo trạng thái "đang gõ" cho người còn lại trong hội thoại
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ) {
    const senderId = (client.data as SocketPayloadUser).userId;

    if (!senderId) {
      return { success: false };
    }

    const parsed = TypingPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return { success: false };
    }

    const { conversationId, isTyping } = parsed.data;

    try {
      const conversation = await this.conversationService.ensureParticipant(
        conversationId,
        senderId,
      );

      const receiverId =
        conversation.participant1 === senderId
          ? conversation.participant2
          : conversation.participant1;

      // Chỉ gửi tới người còn lại, không gửi lại chính người đang gõ
      this.server.to(`user:${receiverId}`).emit('typing', {
        conversationId,
        isTyping,
      });

      return { success: true };
    } catch (error) {
      this.logger.warn(
        `Failed to forward typing status: ${(error as Error).message}`,
      );
      return { success: false };
    }
  }

  // Gửi item hội thoại mới nhất tới room của user để cập nhật danh sách realtime
  private async emitConversationUpdated(
    conversationId: number,
    userId: number,
  ) {
    const item = await this.conversationService.getConversationItem(
      conversationId,
      userId,
    );

    if (item) {
      this.server.to(`user:${userId}`).emit('conversation:updated', item);
    }
  }
}
