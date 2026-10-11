import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { envConfig } from './config/validate-env';
import { AuthGuard } from './guards/access-token.guard';
import { PermissionGuard } from './guards/permission.guard';
import { SharedPermissionRepository } from './repositories/shared-permission.repo';
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
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    PrismaService,
    HashingService,
    EmailService,
    TokenService,
    CloudinaryService,
    SharedRoleRepository,
    SharedPermissionRepository,
  ],
  exports: [
    PrismaService,
    HashingService,
    EmailService,
    CloudinaryService,
    SharedRoleRepository,
    SharedPermissionRepository,
    TokenService,
  ],
})
export class SharedModule {}
