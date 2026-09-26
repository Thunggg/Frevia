import { Injectable } from '@nestjs/common';
import { JsonWebTokenError } from '@nestjs/jwt';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';
import {
  AccessTokenPayloadCreate,
  EmailVerificationType,
  ForgotPasswordBodyType,
  LoginBodyType,
  MessageResType,
  RefreshTokenBodySchemaType,
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
  RefreshTokenRevokedException,
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
      await this.validateVerificationCode({
        code: otpCode,
        email,
        type: TypeOfVerificationCode.EMAIL_VERIFICATION,
      });

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

  async refreshToken(
    payload: RefreshTokenBodySchemaType & {
      userAgent: string;
      ipAddress: string;
    },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      // Verify refresh token
      const { userId } = await this.tokenService.verifyRefreshToken(
        payload.refreshToken,
      );

      // Kiểm tra refresh token có tồn tại trong DB hay ko
      const refreshTokenIsInDB =
        await this.authRepository.findUniqueRefreshTokenIncludeUserRole({
          refreshToken: payload.refreshToken,
        });

      // Kiểm tra token có tồn tại và userId gửi lên có đúng với userId trong db hay ko
      if (!refreshTokenIsInDB || refreshTokenIsInDB.user.id !== userId) {
        throw RefreshTokenRevokedException();
      }

      // Xóa TRƯỚC, đảm bảo không còn request nào khác dùng lại token này
      await this.authRepository.deleteSessionByRefreshToken({
        refreshToken: payload.refreshToken,
        userId,
      });

      const tokens = await this.generateAccessAndRefreshTokens({
        userId,
        roleId: refreshTokenIsInDB.user.userRoles[0].role.id,
        roleName: refreshTokenIsInDB.user.userRoles[0].role.name,
        userAgent: payload.userAgent,
        ipAddress: payload.ipAddress,
      });

      return tokens;
    } catch (error: unknown) {
      // Lỗi P2002 là lỗi unique trong database.
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw UniqueViolationException();
      }
      // Lỗi P2025 là lỗi record not found trong database.
      else if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw RefreshTokenRevokedException();
      } else if (error instanceof PrismaClientValidationError) {
        throw ServerErrorException();
      } else if (error instanceof JsonWebTokenError) {
        throw RefreshTokenRevokedException();
      }
      throw error;
    }
  }

  async logout(refreshToken: string, userId: number): Promise<MessageResType> {
    try {
      await this.authRepository.deleteRefreshToken({
        token: refreshToken,
        userId,
      });
      return { message: 'logout successfully' };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // Session không tồn tại (đã logout trước đó, hoặc refreshToken sai)
        throw RefreshTokenRevokedException();
      } else if (error instanceof PrismaClientValidationError) {
        throw ServerErrorException();
      }
      throw error;
    }
  }

  async forgotPassword(
    payload: ForgotPasswordBodyType,
  ): Promise<MessageResType> {
    const { code, email, newPassword } = payload;

    // Kiểm tra xem user có tồn tại hay không
    const user = await this.authRepository.findUserForLogin(email as string);

    if (!user) {
      throw EmailNotFoundException();
    }

    // kiểm tra mã otp có hợp lệ hay không
    await this.validateVerificationCode({
      email,
      code,
      type: TypeOfVerificationCode.PASSWORD_RESET,
    });

    const passwordHashed = await this.hashingService.hash(newPassword);

    await Promise.all([
      this.authRepository.update({ id: user.id }, { password: passwordHashed }),
      this.authRepository.deleteVerifycationCode({
        email,
        type: TypeOfVerificationCode.PASSWORD_RESET,
      }),
    ]);

    return {
      message: 'Update password successfully',
    };
  }

  async validateVerificationCode(uniqueValue: {
    email: string;
    code: string;
    type: TypeOfVerificationCode;
  }): Promise<
    Pick<
      EmailVerificationType,
      'id' | 'attempts' | 'code' | 'type' | 'expiresAt' | 'createdAt'
    >
  > {
    const verifycationOTP = await this.authRepository.findVerificationCode({
      email: uniqueValue.email,
      code: uniqueValue.code,
      type: uniqueValue.type,
    });

    if (!verifycationOTP) {
      throw InvalidVerificationCodeException();
    }

    if (verifycationOTP.expiresAt < new Date()) {
      throw OTPExpiredException();
    }

    return verifycationOTP;
  }
}
