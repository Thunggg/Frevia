import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './notification.repo';
import { NotificationService } from './notification.service';

@Module({
  imports: [SharedModule],
  controllers: [NotificationController],
  providers: [NotificationRepository, NotificationService],
})
export class NotificationModule {}
