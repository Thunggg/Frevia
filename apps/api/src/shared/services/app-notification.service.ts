import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import { NotificationRealtimeService } from './notification-realtime.service';

export interface SendNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Prisma.InputJsonValue;
}

@Injectable()
export class AppNotificationService {
  private readonly logger = new Logger(AppNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: NotificationRealtimeService,
  ) {}

  async send(params: SendNotificationParams, tx?: Prisma.TransactionClient) {
    try {
      const client = tx ?? this.prisma;
      const notification = await client.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          data: params.data ?? Prisma.DbNull,
        },
      });

      if (notification) {
        this.realtime.emit(params.userId, {
          id: notification.id,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        });
      }

      return notification;
    } catch (error) {
      this.logger.warn(
        `Failed to send notification to user ${params.userId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  async sendMany(
    items: SendNotificationParams[],
    tx?: Prisma.TransactionClient,
  ) {
    return Promise.all(items.map((item) => this.send(item, tx)));
  }
}
