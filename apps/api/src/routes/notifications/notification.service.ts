import { Injectable } from '@nestjs/common';
import { NotificationNotFoundException } from './notification.error';
import { NotificationRepository } from './notification.repo';

@Injectable()
export class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  getAll(userId: number) {
    return this.repository.findAll(userId);
  }

  async markRead(userId: number, notificationId: number) {
    const notification = await this.repository.findById(userId, notificationId);
    if (!notification) throw NotificationNotFoundException();
    if (notification.isRead) return notification;
    return this.repository.markRead(notificationId);
  }

  async markAllRead(userId: number) {
    const result = await this.repository.markAllRead(userId);
    return { message: `${result.count} notification(s) marked as read.` };
  }

  async delete(userId: number, notificationId: number) {
    const notification = await this.repository.findById(userId, notificationId);
    if (!notification) throw NotificationNotFoundException();
    await this.repository.softDelete(notificationId);
    return { message: 'Notification deleted.' };
  }
}
