import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { SessionsController } from './sessions.controller';
import { SessionsRepository } from './sessions.repo';
import { SessionsService } from './sessions.service';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, SessionsRepository],
  imports: [SharedModule],
})
export class SessionsModule {}
