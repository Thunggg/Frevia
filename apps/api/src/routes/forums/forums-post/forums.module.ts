import { Module } from '@nestjs/common';
import { SharedModule } from '../../../shared/shared.module';
import { ForumController } from './forums.controller';
import { ForumRepository } from './forums.repo';
import { ForumService } from './forums.service';

@Module({
  controllers: [ForumController],
  providers: [ForumService, ForumRepository],
  imports: [SharedModule],
})
export class ForumModule {}
