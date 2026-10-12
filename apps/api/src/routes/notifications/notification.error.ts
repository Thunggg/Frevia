import { NotFoundException } from '@nestjs/common';

export const NotificationNotFoundException = () =>
  new NotFoundException([
    { message: 'Notification not found.', path: 'notificationId' },
  ]);
