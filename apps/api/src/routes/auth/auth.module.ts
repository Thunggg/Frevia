import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repo';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  imports: [SharedModule],
})
export class AuthModule {}
