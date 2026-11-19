import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

export type RealtimeNotificationPayload = {
  id: number;
  userId: number;
  type: string;
  title: string | null;
  message: string | null;
  data: unknown;
  isRead: boolean;
  createdAt: Date | string;
};

type RealtimeNotificationEvent = {
  userId: number;
  notification: RealtimeNotificationPayload;
};

/**
 * Cầu nối giữa service nghiệp vụ và gateway socket.
 *
 * Service chỉ cần phát sự kiện, gateway lo phần gửi tới room của user — nhờ vậy
 * module forum không phải phụ thuộc trực tiếp vào module conversations.
 */
@Injectable()
export class NotificationRealtimeService {
  private readonly emitter = new EventEmitter();
  private readonly eventName = 'notification:new';

  emit(userId: number, notification: RealtimeNotificationPayload) {
    this.emitter.emit(this.eventName, { userId, notification });
  }

  subscribe(listener: (event: RealtimeNotificationEvent) => void) {
    this.emitter.on(this.eventName, listener);
    return () => this.emitter.off(this.eventName, listener);
  }
}
