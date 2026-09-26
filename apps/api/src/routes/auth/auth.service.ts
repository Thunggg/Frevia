import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  MessageResType,
  RegisterBodyType,
  SendOTPBodyType,
  TypeOfVerificationCode,
} from '@shared/types';
import { addMilliseconds } from 'date-fns';
import ms, { StringValue } from 'ms';
import { envConfig } from '../../shared/config/validate-env';
import { AppException } from '../../shared/exceptions/app.exception';
import { generateOTP } from '../../shared/helper/generate-otp';
import { EmailService } from '../../shared/services/email.service';
import { HashingService } from '../../shared/services/hashing.service';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      const { email, otpCode, password, fullName } = body;

      // 1. Kiểm tra xem user đã tồn tại hay chưa
      const existingUser = await this.prisma.user.findUnique({
        where: {
          email,
          deletedAt: null,
        },
      });

      if (existingUser && existingUser.isActive) {
        throw new AppException(
          ErrorCode.USER_ALREADY_EXISTS as string,
          'Email already registered and active',
          HttpStatus.CONFLICT,
        );
      }

      if (existingUser && !existingUser.isActive) {
        throw new AppException(
          ErrorCode.USER_ALREADY_EXISTS as string,
          'Your account is banned',
          HttpStatus.FORBIDDEN,
        );
      }

      // 2. Xác thực mã OTP
      const otp = await this.prisma.verificationToken.findFirst({
        where: {
          token: otpCode,
          type: TypeOfVerificationCode.EMAIL_VERIFICATION,
          user: {
            email,
          },
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
      const result = await this.prisma.$transaction(async () => {
        await this.prisma.verificationToken.deleteMany({
          where: {
            token: otpCode,
            type: TypeOfVerificationCode.EMAIL_VERIFICATION,
            user: {
              email,
            },
          },
        });

        const user = await this.prisma.user.create({
          data: {
            email,
            password,
            isActive: true,
            profile: {
              create: {
                displayName: fullName,
              },
            },
          },
        });

        return user;
      });

      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async sendOTP(body: SendOTPBodyType): Promise<MessageResType> {
    try {
      const { email, type } = body;

      // Tìm user theo email
      const user = await this.prisma.user.findUnique({
        where: {
          email,
          deletedAt: null,
        },
      });

      // Kiểm tra nếu user đã tồn tại và type là REGISTER
      if (type === TypeOfVerificationCode.EMAIL_VERIFICATION && user) {
        throw new AppException(
          ErrorCode.USER_ALREADY_EXISTS as string,
          'Email already registered and active',
          HttpStatus.CONFLICT,
        );
      }

      // Kiểm tra nếu user không tồn tại và type là FORGOT_PASSWORD
      if (type === TypeOfVerificationCode.PASSWORD_RESET && !user) {
        throw new AppException(
          ErrorCode.USER_NOT_FOUND as string,
          'Email not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Tạo mã OTP
      const code = generateOTP();

      await this.prisma.verificationToken.create({
        data: {
          token: code,
          type: TypeOfVerificationCode.EMAIL_VERIFICATION,
          expiresAt: addMilliseconds(
            new Date(),
            ms(envConfig.OTP_EXPIRES_IN as StringValue),
          ),
          userId: user!.id,
        },
      });

      await this.emailService.sendOTP({ email, code });

      return { message: 'OTP sent successfully' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
