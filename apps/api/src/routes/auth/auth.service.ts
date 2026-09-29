import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JsonWebTokenError } from '@nestjs/jwt';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';
import {
  AccessTokenPayloadCreate,
  EmailVerificationType,
  ForgotPasswordBodyType,
  GetAuthorizationUrlResType,
  GoogleUserInfo,
  GetMeResType,
  LoginBodyType,
  MessageResType,
  OauthProvider,
  RefreshTokenBodySchemaType,
  RefreshTokenPayloadCreate,
  RegisterBodyType,
  RoleName,
  SendOTPBodyType,
  TypeOfVerificationCode,
  UserType,
  AuthMessage,
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
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  public oauth2Client: OAuth2Client;

  constructor(
    private readonly hashingService: HashingService,
    private readonly emailService: EmailService,
    private readonly sharedRoleRepository: SharedRoleRepository,
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {
    this.oauth2Client = new OAuth2Client({
      clientId: envConfig.GOOGLE_CLIENT_ID,
      clientSecret: envConfig.GOOGLE_CLIENT_SECRET,
      redirectUri: envConfig.GOOGLE_REDIRECT_URL,
    });
  }

  async register(
    body: RegisterBodyType,
  ): Promise<
    Omit<UserType, 'password' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  > {
    try {
      const { email, code, password, fullName, role } = body;

      this.logger.log(`Register attempt for email: ${email}`);

      // 1. Kiểm tra xem user đã tồn tại hay chưa
      const existingUser = await this.authRepository.findUserByEmail(email);

      if (existingUser?.isBanned) {
        this.logger.warn(`Banned user attempted to register: ${email}`);
        throw UserBannedException();
      }

      if (existingUser) {
        throw EmailAlreadyExistsException();
      }

      // 2. Xác thực mã OTP
      await this.validateVerificationCode({
        code,
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
          code,
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

      this.logger.log(
        `User registered successfully: ${email} (id=${result.id})`,
      );
      return result;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw UniqueViolationException();
      } else if (error instanceof PrismaClientValidationError) {
        this.logger.error('PrismaClientValidationError during register', error);
        throw ServerErrorException();
      }
      throw error;
    }
  }

  async sendOTP(body: SendOTPBodyType): Promise<MessageResType> {
    try {
      const { email, type } = body;

      this.logger.log(`Send OTP request: email=${email}, type=${type}`);

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
        this.logger.warn(`OTP rate limit exceeded for email: ${email}`);
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

      this.logger.log(`OTP sent successfully to: ${email}`);
      return { message: 'OTP sent successfully' };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw UniqueViolationException();
      } else if (error instanceof PrismaClientValidationError) {
        this.logger.error('PrismaClientValidationError during sendOTP', error);
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

      this.logger.log(`Login attempt: email=${email}, ip=${ipAddress}`);

      const user = await this.authRepository.findUserForLogin(email);

      // check 2 trường hợp là user không tồn tại hoặc user đăng ký qua OAuth
      if (!user) {
        this.logger.warn(`Login failed — email not found: ${email}`);
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
        this.logger.warn(`Login failed — wrong password: email=${email}`);
        throw IncorrectPasswordException();
      }

      if (user.isBanned) {
        this.logger.warn(`Banned user attempted to login: ${email}`);
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

      this.logger.log(
        `Login successful: userId=${user.id}, role=${primaryRole.name}`,
      );
      return { accessToken, refreshToken };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw UniqueViolationException();
      } else if (error instanceof PrismaClientValidationError) {
        this.logger.error('PrismaClientValidationError during login', error);
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

    // Tạo session
    await this.authRepository.createSession({
      userId,
      refreshToken,
      deviceInfo: userAgent,
      ipAddress: ipAddress,
      expiresAt: addMilliseconds(
        new Date(),
        ms(envConfig.REFRESH_TOKEN_EXPIRES_IN as StringValue) as number,
      ),
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
      this.logger.log(`Logout request: userId=${userId}`);
      await this.authRepository.deleteSessionByRefreshToken({
        refreshToken,
        userId,
      });
      this.logger.log(`Logout successful: userId=${userId}`);
      return { message: 'logout successfully' };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        // Session không tồn tại (đã logout trước đó, hoặc refreshToken sai)
        throw RefreshTokenRevokedException();
      } else if (error instanceof PrismaClientValidationError) {
        this.logger.error('PrismaClientValidationError during logout', error);
        throw ServerErrorException();
      }
      throw error;
    }
  }

  async forgotPassword(
    payload: ForgotPasswordBodyType,
  ): Promise<MessageResType> {
    const { code, email, newPassword } = payload;

    this.logger.log(`Forgot password request: email=${email}`);

    // Kiểm tra xem user có tồn tại hay không
    const user = await this.authRepository.findUserForLogin(email as string);

    if (!user) {
      throw EmailNotFoundException();
    }

    // Kiểm tra xem user có bị ban hay không
    if (user.isBanned) {
      this.logger.warn(`Banned user attempted forgot password: ${email}`);
      throw UserBannedException();
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

    this.logger.log(`Password reset successful: userId=${user.id}`);
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

  async getMe(userId: number): Promise<GetMeResType> {
    const user = await this.authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException([
        { message: AuthMessage.EMAIL_NOT_FOUND, path: 'userId' },
      ]);
    }

    return {
      id: user.id,
      email: user.email,
      isBanned: user.isBanned,
      profile: user.profile
        ? {
            displayName: user.profile.displayName,
            avatarUrl: user.profile.avatarUrl,
          }
        : null,
      roles: user.userRoles.map((userRole) => ({
        name: userRole.role.name as GetMeResType['roles'][number]['name'],
        isPrimary: userRole.isPrimary,
      })),
    };
  }

  getAuthorizationUrl(payload: {
    userAgent: string;
    ip: string;
  }): GetAuthorizationUrlResType {
    const { userAgent, ip } = payload;

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const state = Buffer.from(JSON.stringify({ userAgent, ip })).toString(
      'base64url',
    );

    const authorizationUrl = this.oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',
      /** Pass in the scopes array defined above.
       * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
      scope: scopes,
      // Enable incremental authorization. Recommended as a best practice.
      include_granted_scopes: true,
      // Include the state parameter to reduce the risk of CSRF attacks.
      state: state,
    });

    return { url: authorizationUrl };
  }

  async googleCallback(payload: { code: string; state: string }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const { code } = payload;

    let userAgent = 'Unknown';
    let ip = 'Unknown';

    try {
      const clientInfor = JSON.parse(
        Buffer.from(payload.state, 'base64url').toString(),
      );

      userAgent = clientInfor.userAgent;
      ip = clientInfor.ip;
    } catch (error) {
      this.logger.error('Error parsing client information', error);
    }

    // Lấy token từ Google
    const { tokens } = await this.oauth2Client.getToken(code as string);
    this.oauth2Client.setCredentials(tokens);

    const { data } = await this.oauth2Client.request<GoogleUserInfo>({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      method: 'GET',
    });

    if (!data.email) {
      throw EmailNotFoundException();
    }

    let user = await this.authRepository.findUserByEmailIncludeRoles(
      data.email as string,
    );

    // Nếu user không tồn tại thì tạo mới user
    if (!user) {
      // Tạo user mới
      user = await this.authRepository.createUserAndRegisterGoogle({
        email: data.email as string,
        fullName: data.name as string,
        roleId: await this.sharedRoleRepository.getClientRoleId(),
      });

      // Tạo oauth account
      await this.authRepository.createOauthAccount({
        userId: user.id,
        provider: OauthProvider.GOOGLE,
        providerUserId: data.id as string,
      });
    }

    const { accessToken, refreshToken } =
      await this.generateAccessAndRefreshTokens({
        userId: user.id,
        roleId: user.userRoles[0].role.id,
        roleName: user.userRoles[0].role.name,
        userAgent: userAgent,
        ipAddress: ip,
      });

    return { accessToken, refreshToken };
  }
}
// {
//   id: '118389814231216508675',
//   email: 'thuannguyen20041028@gmail.com',
//   verified_email: true,
//   name: 'Thuận Nguyễn',
//   given_name: 'Thuận',
//   family_name: 'Nguyễn',
//   picture: 'https://lh3.googleusercontent.com/a/ACg8ocITheMMiGy_x10mdJz75Y0y_u1K6iLm2Hz6msMSQP4y3n-Ex_x7=s96-c'
// }
