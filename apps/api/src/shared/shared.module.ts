import { Module } from '@nestjs/common';
import { SharedRoleRepository } from './repositories/shared-role.repo';
import { EmailService } from './services/email.service';
import { HashingService } from './services/hashing.service';
import { PrismaService } from './services/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    PrismaService,
    HashingService,
    EmailService,
    SharedRoleRepository,
  ],
  exports: [PrismaService, HashingService, EmailService, SharedRoleRepository],
})
export class SharedModule {}
