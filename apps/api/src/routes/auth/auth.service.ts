import { Injectable } from '@nestjs/common';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';
import {
  AccessTokenPayloadCreate,
  LoginBodyType,
  MessageResType,
  RefreshTokenPayloadCreate,
  RegisterBodyType,
  RoleName,
  SendOTPBodyType,
  TypeOfVerificationCode,
  UserType,
} from '@shared/types';
import { addMilliseconds } from 'date-fns';
import ms, { StringValue } from 'ms';
import { envConfig } from '../../shared/config/validate-env';
import { ServerErrorException } from '../../shared/errors/shared-message.error';
import { generateOTP } from '../../shared/helper/generate-otp';
import { SharedRoleRepository } from '../../shared/repositories/shared-role.repo';
import { EmailService } from '../../shared/services/email.service';
import { HashingService } from '../../shared/services/hashing.service';
import { TokenService } from '../../shared/services/token.service';
import {
  EmailAlreadyExistsException,
  EmailNotFoundException,
  IncorrectEmailException,
  IncorrectPasswordException,
  InvalidVerificationCodeException,
  OTPExpiredException,
  RoleNotFoundException,
  TooManyAttemptsException,
  UniqueViolationException,
  UserBannedException,
} from './auth.error';
import { AuthRepository } from './auth.repo';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly emailService: EmailService,
    private readonly sharedRoleRepository: SharedRoleRepository,
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async register(
    body: RegisterBodyType,
  ): Promise<
    Omit<UserType, 'password' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  > {
    try {
      const { email, otpCode, password, fullName, role } = body;

      // 1. Kiểm tra xem user đã tồn tại hay chưa
      const existingUser = await this.authRepository.findUserByEmail(email);

      if (existingUser?.isBanned) {
        throw UserBannedException();
      }

      if (existingUser) {
        throw EmailAlreadyExistsException();
      }

      // 2. Xác thực mã OTP
      const otp = await this.authRepository.findVerificationCode(
        otpCode,
        TypeOfVerificationCode.EMAIL_VERIFICATION,
        email,
      );

      if (!otp) {
        throw InvalidVerificationCodeException();
      }

      if (otp.expiresAt < new Date()) {
        throw OTPExpiredException();
      }

      // 3. Tạo User trong transaction
      let roleId: number;
      if (role === RoleName.CLIENT) {
        roleId = await this.sharedRoleRepository.getClientRoleId();
      } else if (role === RoleName.FREELANCER) {
        roleId = await this.sharedRoleRepository.getFreelancerRoleId();
      } else {
        roleId = await this.sharedRoleRepository.getAdminRoleId();
      }

      const hashedPassword = await this.hashingService.hash(password as string);

      const result = await this.authRepository.createUserAndRegister(
        {
          code: otpCode,
          type: TypeOfVerificationCode.EMAIL_VERIFICATION,
          email,
        },
        {
          email,
          password: hashedPassword,
          fullName,
          roleId,
        },
      );

      return result;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw UniqueViolationException();
      } else if (error instanceof PrismaClientValidationError) {
        throw ServerErrorException();
      }
      throw error;
    }
  }

  async sendOTP(body: SendOTPBodyType): Promise<MessageResType> {
    try {
      const { email, type } = body;

      const [user, record] = await Promise.all([
        this.authRepository.findUserByEmail(email),
        this.authRepository.findVerificationCodeByEmailAndType(email, type),
      ]);

      if (type === TypeOfVerificationCode.EMAIL_VERIFICATION && user) {
        throw EmailAlreadyExistsException();
      }

      if (type === TypeOfVerificationCode.PASSWORD_RESET && !user) {
        throw EmailNotFoundException();
      }

      // Kiểm tra xem nếu đang bị block attempt mà đã hết thời gian block thì reset lại cho người dùng
      const ATTEMPT_WINDOW_MS = ms(
        envConfig.OTP_ATTEMPT_WINDOW as StringValue,
      ) as number;
      const now = new Date();

      const windowExpired =
        record &&
        now.getTime() - record.createdAt.getTime() > ATTEMPT_WINDOW_MS;

      if (record && record.attempts > 5 && !windowExpired) {
        throw TooManyAttemptsException();
      }

      // Tạo mã OTP
      const code = generateOTP();
      const expiresAt = addMilliseconds(
        now,
        ms(envConfig.OTP_EXPIRES_IN as StringValue) as number,
      );
      const newAttempts = !record || windowExpired ? 1 : record.attempts + 1;

      await this.authRepository.upsertVerificationCode({
        email,
        type,
        code,
        expiresAt,
        attempts: newAttempts,
      });

      await this.emailService.sendOTP({ email, code });

      return { message: 'OTP sent successfully' };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw UniqueViolationException();
      } else if (error instanceof PrismaClientValidationError) {
        throw ServerErrorException();
      }
      throw error;
    }
  }

  async login(
    body: LoginBodyType & { userAgent: string; ipAddress: string },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const { email, password, userAgent, ipAddress } = body;

      const user = await this.authRepository.findUserForLogin(email);

      // check 2 trường hợp là user không tồn tại hoặc user đăng ký qua OAuth
      if (!user) {
        throw IncorrectEmailException();
      }

      if (!user.password) {
        throw IncorrectPasswordException();
      }

      const isPasswordValid = await this.hashingService.verify(
        password as string,
        user.password,
      );

      if (!isPasswordValid) {
        throw IncorrectPasswordException();
      }

      if (user.isBanned) {
        throw UserBannedException();
      }

      // Lấy ra role đầu tiên của user đã chọn hoặc lần switch role gần nhất
      const primaryRole = user.userRoles[0]?.role;
      if (!primaryRole) {
        throw RoleNotFoundException();
      }

      const { accessToken, refreshToken } =
        await this.generateAccessAndRefreshTokens({
          userId: user.id,
          roleId: primaryRole.id,
          roleName: primaryRole.name,
          userAgent,
          ipAddress,
        });

      return { accessToken, refreshToken };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw UniqueViolationException();
      } else if (error instanceof PrismaClientValidationError) {
        throw ServerErrorException();
      }
      throw error;
    }
  }

  private async generateAccessAndRefreshTokens({
    userId,
    roleId,
    roleName,
    userAgent,
    ipAddress,
  }: {
    userId: number;
    roleId: number;
    roleName: string;
    userAgent: string;
    ipAddress: string;
  }) {
    const accessTokenPayload: AccessTokenPayloadCreate = {
      userId,
      roleId,
      roleName,
    };
    const accessToken =
      await this.tokenService.signAccessToken(accessTokenPayload);
    const refreshTokenPayload: RefreshTokenPayloadCreate = {
      userId,
    };
    const refreshToken =
      await this.tokenService.signRefreshToken(refreshTokenPayload);

    const refreshDecoded =
      await this.tokenService.verifyRefreshToken(refreshToken);

    // Tạo session
    await this.authRepository.createSession({
      userId,
      refreshToken,
      deviceInfo: userAgent,
      ipAddress: ipAddress,
      expiresAt: new Date(refreshDecoded.exp * 1000),
    });

    return { accessToken, refreshToken };
  }
}
