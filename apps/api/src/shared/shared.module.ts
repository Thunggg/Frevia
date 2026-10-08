import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { envConfig } from './config/validate-env';
import { AuthGuard } from './guards/access-token.guard';
import { SharedRoleRepository } from './repositories/shared-role.repo';
import { CloudinaryService } from './services/cloudinary.service';
import { EmailService } from './services/email.service';
import { HashingService } from './services/hashing.service';
import { PrismaService } from './services/prisma.service';
import { TokenService } from './services/token.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: envConfig.ACCESS_TOKEN_SECRET,
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    PrismaService,
    HashingService,
    EmailService,
    TokenService,
    CloudinaryService,
    SharedRoleRepository,
  ],
  exports: [
    PrismaService,
    HashingService,
    EmailService,
    CloudinaryService,
    SharedRoleRepository,
    TokenService,
  ],
})
export class SharedModule {}
