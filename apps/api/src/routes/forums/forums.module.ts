import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { ForumController } from './forums.controller';
import { ForumService } from './forums.service';

@Module({
  controllers: [ForumController],
  providers: [ForumService],
  imports: [SharedModule],
})
export class ForumModule {}
