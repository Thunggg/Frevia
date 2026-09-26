import { Module } from '@nestjs/common';
import { HashingService } from './services/hashing.service';
import { PrismaService } from './services/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [PrismaService, HashingService],
  exports: [PrismaService, HashingService],
})
export class SharedModule {}
