import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(userId: number, notificationId: number) {
    return this.prisma.notification.findFirst({
      where: { id: notificationId, userId, deletedAt: null },
    });
  }

  markRead(notificationId: number) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  markAllRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true },
    });
  }

  softDelete(notificationId: number) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { deletedAt: new Date() },
    });
  }
}
