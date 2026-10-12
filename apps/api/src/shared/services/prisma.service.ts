import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DIRECT_URL!,
      // Giới hạn backend của Supabase pooler (session mode) = 15;
      // pool app phải thấp hơn để không bị EMAXCONNSESSION.
      max: 10,
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 10_000,
    });
    super({ adapter });
  }
}
