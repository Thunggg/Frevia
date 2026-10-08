import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ConversationController } from './conversations.controller';
import { ConversationRepository } from './conversations.repo';
import { ConversationService } from './conversations.service';
import { ConversationsGateway } from './conversations.gateway';

@Module({
  controllers: [ConversationController],
  providers: [
    ConversationService,
    ConversationRepository,
    ConversationsGateway,
  ],
  imports: [SharedModule],
})
export class ConversationModule {}
