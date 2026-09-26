import { Injectable } from '@nestjs/common';
import { RegisterBodyType } from '@shared/types';
import { HashingService } from '../../shared/services/hashing.service';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
  ) {}

  register(body: RegisterBodyType) {
    return body;
  }
}
