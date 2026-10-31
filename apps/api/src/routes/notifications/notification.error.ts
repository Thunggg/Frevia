import { NotFoundException } from '@nestjs/common';
import { NotificationMessage } from '@shared/types';

export const NotificationNotFoundException = () =>
  new NotFoundException([
    { message: NotificationMessage.NOT_FOUND, path: 'notificationId' },
  ]);
