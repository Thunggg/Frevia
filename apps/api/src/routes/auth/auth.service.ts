import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ErrorCode,
  MessageResType,
  RegisterBodyType,
  RoleName,
  SendOTPBodyType,
  TypeOfVerificationCode,
} from '@shared/types';
import { addMilliseconds } from 'date-fns';
import ms, { StringValue } from 'ms';
import { envConfig } from '../../shared/config/validate-env';
import { AppException } from '../../shared/exceptions/app.exception';
import { generateOTP } from '../../shared/helper/generate-otp';
import { SharedRoleRepository } from '../../shared/repositories/shared-role.repo';
import { EmailService } from '../../shared/services/email.service';
import { HashingService } from '../../shared/services/hashing.service';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
    private emailService: EmailService,
    private sharedRoleRepository: SharedRoleRepository,
  ) {}

  async register(body: RegisterBodyType) {
    try {
      const { email, otpCode, password, fullName, role } = body;

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
      const otp = await this.prisma.verificationCode.findFirst({
        where: {
          code: otpCode,
          type: TypeOfVerificationCode.EMAIL_VERIFICATION,
          email,
        },
      });

      // Kiểm tra xem otp có tồn tại hay ko
      if (!otp) {
        throw new AppException(
          ErrorCode.INVALID_OTP as string,
          'Invalid OTP',
          HttpStatus.NOT_FOUND,
        );
      }

      // Kiểm tra xem otp đã hết hạn hay chưa
      if (otp.expiresAt < new Date()) {
        throw new AppException(
          ErrorCode.OTP_EXPIRED as string,
          'OTP has expired',
          HttpStatus.NOT_FOUND,
        );
      }

      // Tạo User
      const result = await this.prisma.$transaction(async () => {
        let roleId: number;
        if (role === RoleName.CLIENT) {
          roleId = await this.sharedRoleRepository.getClientRoleId();
        } else if (role === RoleName.FREELANCER) {
          roleId = await this.sharedRoleRepository.getFreelancerRoleId();
        } else {
          roleId = await this.sharedRoleRepository.getAdminRoleId();
        }

        await this.prisma.verificationCode.deleteMany({
          where: {
            code: otpCode,
            type: TypeOfVerificationCode.EMAIL_VERIFICATION,
            email,
          },
        });

        const hashedPassword = await this.hashingService.hash(
          password as string,
        );

        const user = await this.prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            isActive: true,
            profile: {
              create: {
                displayName: fullName,
              },
            },
            userRoles: {
              create: {
                roleId,
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

      // Tìm user theo email và tìm đã có record của otp nào hay chưa
      const [user, record] = await Promise.all([
        this.prisma.user.findUnique({
          where: {
            email,
            deletedAt: null,
          },
        }),
        this.prisma.verificationCode.findUnique({
          where: { email_type: { email, type } },
        }),
      ]);

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

      // Kiểm tra OTP xem đã vượt quá số lần thử hay chưa
      if (record && record.attempts > 5)
        throw new AppException(
          ErrorCode.TOO_MANY_ATTEMPTS as string,
          'Too many attempts',
          HttpStatus.TOO_MANY_REQUESTS,
        );

      // Tạo mã OTP
      const code = generateOTP();

      await this.prisma.verificationCode.upsert({
        where: {
          email_type: {
            email,
            type,
          },
        },
        update: {
          code,
          expiresAt: addMilliseconds(
            new Date(),
            ms(envConfig.OTP_EXPIRES_IN as StringValue) as number,
          ),
          createdAt: new Date(),
          attempts: {
            increment: 1,
          },
        },
        create: {
          email,
          code,
          type: TypeOfVerificationCode.EMAIL_VERIFICATION,
          expiresAt: addMilliseconds(
            new Date(),
            ms(envConfig.OTP_EXPIRES_IN as StringValue) as number,
          ),
          createdAt: new Date(),
          attempts: 1,
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
