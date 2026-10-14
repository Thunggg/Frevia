import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repo';
import { UsersService } from './users.service';

@Module({
  imports: [SharedModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
