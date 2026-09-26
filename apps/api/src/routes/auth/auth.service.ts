import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode, RegisterBodyType } from '@shared/types';
import { AppException } from '../../shared/exceptions/app.exception';
import { HashingService } from '../../shared/services/hashing.service';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      const { email, otpCode, password } = body;

      // Kiểm tra xem user đã tồn tại hay chưa
      const isUserExist = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (isUserExist) {
        throw new AppException(
          ErrorCode.USER_ALREADY_EXISTS as string,
          'User already exists',
          HttpStatus.CONFLICT,
        );
      }

      // Xác thực mã OTP
      const otp = await this.prisma.emailVerification.findFirst({
        where: {
          user: {
            email,
          },
          token: otpCode,
          expiresAt: {
            gte: new Date(),
          },
        },
      });

      if (!otp) {
        throw new AppException(
          ErrorCode.INVALID_OTP as string,
          'Invalid OTP',
          HttpStatus.NOT_FOUND,
        );
      }

      // Tạo User
      const user = await this.prisma.user.create({
        data: {
          email,
          password,
          isActive: true,
        },
      });

      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
