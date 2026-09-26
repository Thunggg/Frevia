import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [SharedModule],
})
export class AuthModule {}
