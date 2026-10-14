import { createZodDto } from 'nestjs-zod';
import { NotificationListSchema, NotificationSchema } from '@shared/types';

export class NotificationDto extends createZodDto(NotificationSchema) {}
export class NotificationListDto extends createZodDto(NotificationListSchema) {}
