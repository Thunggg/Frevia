import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { NotificationDto, NotificationListDto } from './notification.dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  @ZodSerializerDto(NotificationListDto)
  getAll(@UserActive('userId') userId: number) {
    return this.service.getAll(userId);
  }

  @Patch('read-all')
  markAllRead(@UserActive('userId') userId: number) {
    return this.service.markAllRead(userId);
  }

  @Patch(':id/read')
  @ZodSerializerDto(NotificationDto)
  markRead(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.markRead(userId, id);
  }

  @Delete(':id')
  delete(
    @UserActive('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.delete(userId, id);
  }
}
