import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { HashingService } from './services/hashing.service';
import { PrismaService } from './services/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService, HashingService, EmailService],
  exports: [PrismaService, HashingService, EmailService],
})
export class SharedModule {}
