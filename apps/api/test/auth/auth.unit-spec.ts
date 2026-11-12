jest.mock('../../src/shared/config/validate-env', () => ({
  envConfig: {
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    GOOGLE_REDIRECT_URL: 'http://localhost:3000/auth/google/callback',
    REFRESH_TOKEN_EXPIRES_IN: '7d',
    OTP_EXPIRES_IN: '5m',
    OTP_ATTEMPT_WINDOW: '1m',
  },
}));

import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JsonWebTokenError } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { RoleName, TypeOfVerificationCode } from '@shared/types';
import { AuthRepository } from '../../src/routes/auth/auth.repo';
import { AuthService } from '../../src/routes/auth/auth.service';
import { SharedRoleRepository } from '../../src/shared/repositories/shared-role.repo';
import { EmailService } from '../../src/shared/services/email.service';
import { HashingService } from '../../src/shared/services/hashing.service';
import { TokenService } from '../../src/shared/services/token.service';

describe('User Authentication (UF-37 to UF-41)', () => {
  const hashingService = {
    hash: jest.fn(),
    verify: jest.fn(),
  };

  const emailService = {
    sendOTP: jest.fn(),
  };

  const sharedRoleRepository = {
    getClientRoleId: jest.fn(),
    getFreelancerRoleId: jest.fn(),
    getAdminRoleId: jest.fn(),
  };

  const authRepository = {
    findUserById: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserForLogin: jest.fn(),
    findUserByEmailIncludeRole: jest.fn(),
    createUserAndRegister: jest.fn(),
    createUserAndRegisterGoogle: jest.fn(),
    createOauthAccount: jest.fn(),
    createSession: jest.fn(),
    deleteSessionByRefreshToken: jest.fn(),
    findVerificationCode: jest.fn(),
    update: jest.fn(),
    deleteVerifycationCode: jest.fn(),
  };

  const tokenService = {
    signAccessToken: jest.fn(),
    signRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };

  const service = new AuthService(
    hashingService as unknown as HashingService,
    emailService as unknown as EmailService,
    sharedRoleRepository as unknown as SharedRoleRepository,
    authRepository as unknown as AuthRepository,
    tokenService as unknown as TokenService,
  );

  const mockGetToken = jest.fn();
  const mockSetCredentials = jest.fn();
  const mockOAuthRequest = jest.fn();

  const validState = Buffer.from(
    JSON.stringify({ userAgent: 'Mozilla/5.0', ip: '127.0.0.1' }),
  ).toString('base64url');

  const futureDate = new Date(Date.now() + 300_000);
  const pastDate = new Date(Date.now() - 300_000);

  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    service.oauth2Client = {
      getToken: mockGetToken,
      setCredentials: mockSetCredentials,
      request: mockOAuthRequest,
    } as unknown as typeof service.oauth2Client;

    tokenService.signRefreshToken.mockResolvedValue('refresh-token-jwt');
    tokenService.signAccessToken.mockResolvedValue('access-token-jwt');
    authRepository.createSession.mockResolvedValue({ id: 101 });
  });

  describe('UF-37 googleCallback', () => {
    // UF-37: Đăng nhập Google OAuth thành công cho tài khoản đã tồn tại và trả về cặp JWT token.
    it('returns access and refresh tokens when an existing user signs in via Google OAuth', async () => {
      mockGetToken.mockResolvedValue({ tokens: { access_token: 'g-token' } });
      mockOAuthRequest.mockResolvedValue({
        data: { id: 'g-1', email: 'user@frevia.com', name: 'Existing User' },
      });
      authRepository.findUserByEmailIncludeRole.mockResolvedValue({
        id: 1,
        email: 'user@frevia.com',
        isBanned: false,
        role: { id: 2, name: RoleName.CLIENT },
      });

      const result = await service.googleCallback({
        code: 'valid-google-code',
        state: validState,
      });

      expect(result).toEqual({
        accessToken: 'access-token-jwt',
        refreshToken: 'refresh-token-jwt',
      });
      expect(authRepository.createUserAndRegisterGoogle).not.toHaveBeenCalled();
    });

    // Tự động khởi tạo tài khoản Client và liên kết OAuth khi người dùng đăng nhập Google lần đầu.
    it('provisions a new client account and returns tokens when a new Google profile signs in', async () => {
      mockGetToken.mockResolvedValue({ tokens: { access_token: 'g-token' } });
      mockOAuthRequest.mockResolvedValue({
        data: { id: 'g-new', email: 'new@frevia.com', name: 'New Google User' },
      });
      authRepository.findUserByEmailIncludeRole.mockResolvedValue(null);
      sharedRoleRepository.getClientRoleId.mockResolvedValue(2);
      authRepository.createUserAndRegisterGoogle.mockResolvedValue({
        id: 15,
        email: 'new@frevia.com',
        isBanned: false,
        role: { id: 2, name: RoleName.CLIENT },
      });
      authRepository.createOauthAccount.mockResolvedValue({ id: 1 });

      const result = await service.googleCallback({
        code: 'new-user-code',
        state: validState,
      });

      expect(authRepository.createUserAndRegisterGoogle).toHaveBeenCalledWith({
        email: 'new@frevia.com',
        fullName: 'New Google User',
        roleId: 2,
      });
      expect(authRepository.createOauthAccount).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'access-token-jwt',
        refreshToken: 'refresh-token-jwt',
      });
    });

    it('provisions a new freelancer account and returns tokens when a new Google profile signs in with FREELANCER role', async () => {
      mockGetToken.mockResolvedValue({ tokens: { access_token: 'g-token' } });
      mockOAuthRequest.mockResolvedValue({
        data: { id: 'g-freelancer', email: 'freelancer@frevia.com', name: 'New Freelancer User' },
      });
      authRepository.findUserByEmailIncludeRole.mockResolvedValue(null);
      sharedRoleRepository.getFreelancerRoleId.mockResolvedValue(3);
      authRepository.createUserAndRegisterGoogle.mockResolvedValue({
        id: 16,
        email: 'freelancer@frevia.com',
        isBanned: false,
        role: { id: 3, name: RoleName.FREELANCER },
      });
      authRepository.createOauthAccount.mockResolvedValue({ id: 2 });

      const freelancerState = Buffer.from(
        JSON.stringify({ userAgent: 'Jest/Test', ip: '127.0.0.1', role: RoleName.FREELANCER }),
      ).toString('base64url');

      const result = await service.googleCallback({
        code: 'freelancer-code',
        state: freelancerState,
      });

      expect(sharedRoleRepository.getFreelancerRoleId).toHaveBeenCalled();
      expect(authRepository.createUserAndRegisterGoogle).toHaveBeenCalledWith({
        email: 'freelancer@frevia.com',
        fullName: 'New Freelancer User',
        roleId: 3,
      });
      expect(result).toEqual({
        accessToken: 'access-token-jwt',
        refreshToken: 'refresh-token-jwt',
      });
    });

    // Từ chối xác thực khi mã ủy quyền Google không hợp lệ hoặc đã hết hạn.
    it('throws UnauthorizedException when the Google authorization code is invalid or expired', async () => {
      mockGetToken.mockRejectedValue(
        new UnauthorizedException('Invalid authorization code'),
      );

      await expect(
        service.googleCallback({ code: 'expired-code', state: validState }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    // Chặn đăng nhập Google với lỗi 403 Forbidden khi tài khoản người dùng đang bị khóa.
    it('throws ForbiddenException when the Google account belongs to a banned user', async () => {
      mockGetToken.mockResolvedValue({ tokens: { access_token: 'g-token' } });
      mockOAuthRequest.mockResolvedValue({
        data: { id: 'g-ban', email: 'banned@frevia.com', name: 'Banned User' },
      });
      authRepository.findUserByEmailIncludeRole.mockResolvedValue({
        id: 9,
        email: 'banned@frevia.com',
        isBanned: true,
        role: { id: 2, name: RoleName.CLIENT },
      });

      await expect(
        service.googleCallback({ code: 'valid-code', state: validState }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Ném ngoại lệ khi kết nối cơ sở dữ liệu bị gián đoạn trong quá trình xử lý Google OAuth.
    it('propagates database error when the database connection fails during Google login', async () => {
      mockGetToken.mockResolvedValue({ tokens: { access_token: 'g-token' } });
      mockOAuthRequest.mockResolvedValue({
        data: { id: 'g-1', email: 'user@frevia.com', name: 'User' },
      });
      authRepository.findUserByEmailIncludeRole.mockRejectedValue(
        new InternalServerErrorException('Database connection timeout'),
      );

      await expect(
        service.googleCallback({ code: 'valid-code', state: validState }),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-38 login', () => {
    const baseLoginPayload = {
      email: 'client@frevia.com',
      password: 'Password@123',
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.1',
    };

    // UF-38: Đăng nhập thành công bằng email và mật khẩu hợp lệ, trả về accessToken và refreshToken.
    it('returns access and refresh tokens when email and password match an active account', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 1,
        email: 'client@frevia.com',
        password: 'hashed-password',
        isBanned: false,
        role: { id: 2, name: RoleName.CLIENT },
      });
      hashingService.verify.mockResolvedValue(true);

      const result = await service.login(baseLoginPayload);

      expect(result).toEqual({
        accessToken: 'access-token-jwt',
        refreshToken: 'refresh-token-jwt',
      });
      expect(authRepository.createSession).toHaveBeenCalled();
    });

    // Trả về lỗi 401 Unauthorized khi email chưa được đăng ký trong hệ thống.
    it('throws UnauthorizedException when the email does not exist', async () => {
      authRepository.findUserForLogin.mockResolvedValue(null);

      await expect(
        service.login({ ...baseLoginPayload, email: 'unknown@frevia.com' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    // Trả về lỗi 422 UnprocessableEntityException khi mật khẩu nhập vào không khớp.
    it('throws UnprocessableEntityException when the password does not match', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 1,
        email: 'client@frevia.com',
        password: 'hashed-password',
        isBanned: false,
        role: { id: 2, name: RoleName.CLIENT },
      });
      hashingService.verify.mockResolvedValue(false);

      await expect(
        service.login({ ...baseLoginPayload, password: 'WrongPassword@1' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    // Chặn đăng nhập với lỗi 403 Forbidden khi tài khoản người dùng đang bị khóa (isBanned = true).
    it('throws ForbiddenException when the user account is banned', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 1,
        email: 'banned@frevia.com',
        password: 'hashed-password',
        isBanned: true,
        role: { id: 2, name: RoleName.CLIENT },
      });
      hashingService.verify.mockResolvedValue(true);

      await expect(service.login(baseLoginPayload)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    // Từ chối đăng nhập khi tài khoản OAuth chưa thiết lập mật khẩu đăng nhập trực tiếp.
    it('throws UnprocessableEntityException when the account has no password set', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 1,
        email: 'oauth-only@frevia.com',
        password: null,
        isBanned: false,
        role: { id: 2, name: RoleName.CLIENT },
      });

      await expect(service.login(baseLoginPayload)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    // Trả về lỗi 404 NotFoundException khi tài khoản không có bất kỳ vai trò nào được gán.
    it('throws NotFoundException when the user has no assigned primary role', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 1,
        email: 'norole@frevia.com',
        password: 'hashed-password',
        isBanned: false,
        role: null,
      });
      hashingService.verify.mockResolvedValue(true);

      await expect(service.login(baseLoginPayload)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // Cấp token mang đúng vai trò Client khi người dùng có role chính là Client.
    it('signs access token with Client role when a client account logs in', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 10,
        email: 'client@frevia.com',
        password: 'hashed-password',
        isBanned: false,
        role: { id: 2, name: RoleName.CLIENT },
      });
      hashingService.verify.mockResolvedValue(true);

      await service.login(baseLoginPayload);

      expect(tokenService.signAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 10,
          roleId: 2,
          roleName: RoleName.CLIENT,
        }),
      );
    });

    // Cấp token mang đúng vai trò Freelancer khi người dùng có role chính là Freelancer.
    it('signs access token with Freelancer role when a freelancer account logs in', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 11,
        email: 'freelancer@frevia.com',
        password: 'hashed-password',
        isBanned: false,
        role: { id: 3, name: RoleName.FREELANCER },
      });
      hashingService.verify.mockResolvedValue(true);

      await service.login({
        ...baseLoginPayload,
        email: 'freelancer@frevia.com',
      });

      expect(tokenService.signAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 11,
          roleId: 3,
          roleName: RoleName.FREELANCER,
        }),
      );
    });

    // Cấp token mang đúng vai trò Admin khi quản trị viên đăng nhập vào hệ thống.
    it('signs access token with Admin role when an administrator logs in', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 1,
        email: 'admin@frevia.com',
        password: 'hashed-password',
        isBanned: false,
        role: { id: 1, name: RoleName.ADMIN },
      });
      hashingService.verify.mockResolvedValue(true);

      await service.login({
        ...baseLoginPayload,
        email: 'admin@frevia.com',
      });

      expect(tokenService.signAccessToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          roleId: 1,
          roleName: RoleName.ADMIN,
        }),
      );
    });

    // Ném ngoại lệ khi cơ sở dữ liệu gặp sự cố kết nối trong lúc đăng nhập.
    it('propagates database exception when the database query fails during login', async () => {
      authRepository.findUserForLogin.mockRejectedValue(
        new InternalServerErrorException('Database connection error'),
      );

      await expect(service.login(baseLoginPayload)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-39 logout', () => {
    // UF-39: Đăng xuất thành công và xóa phiên làm việc tương ứng với refreshToken hợp lệ.
    it('deletes the active session and returns a logout confirmation message', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({ userId: 10 });
      authRepository.deleteSessionByRefreshToken.mockResolvedValue({ id: 101 });

      const result = await service.logout('valid-refresh-token');

      expect(authRepository.deleteSessionByRefreshToken).toHaveBeenCalledWith({
        refreshToken: 'valid-refresh-token',
        userId: 10,
      });
      expect(result).toEqual({ message: 'logout successfully' });
    });

    // Trả về lỗi 401 Unauthorized khi phiên đăng nhập đã bị thu hồi trước đó (Prisma P2025).
    it('throws UnauthorizedException when the session was already revoked in the database', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({ userId: 10 });
      authRepository.deleteSessionByRefreshToken.mockRejectedValue(
        new PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: '6.0.0',
        }),
      );

      await expect(
        service.logout('revoked-refresh-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    // Trả về lỗi 401 Unauthorized khi chữ ký JWT của refreshToken không hợp lệ.
    it('throws UnauthorizedException when the refresh token JWT signature is invalid', async () => {
      tokenService.verifyRefreshToken.mockRejectedValue(
        new JsonWebTokenError('invalid signature'),
      );

      await expect(
        service.logout('malformed-refresh-token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    // Đảm bảo truyền chính xác userId trích xuất từ token khi xóa phiên đăng nhập.
    it('passes the authenticated userId extracted from the token to session deletion', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({ userId: 42 });
      authRepository.deleteSessionByRefreshToken.mockResolvedValue({ id: 205 });

      await service.logout('user-42-refresh-token');

      expect(authRepository.deleteSessionByRefreshToken).toHaveBeenCalledWith({
        refreshToken: 'user-42-refresh-token',
        userId: 42,
      });
    });

    // Chuyển tiếp lỗi hệ thống khi giao dịch xóa phiên trong cơ sở dữ liệu thất bại.
    it('propagates unexpected database failure during session deletion', async () => {
      tokenService.verifyRefreshToken.mockResolvedValue({ userId: 10 });
      authRepository.deleteSessionByRefreshToken.mockRejectedValue(
        new InternalServerErrorException('Database transaction failure'),
      );

      await expect(
        service.logout('valid-refresh-token'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('UF-40 register', () => {
    const validRegisterBody = {
      email: 'newclient@frevia.com',
      code: '123456',
      password: 'Password@123',
      confirmPassword: 'Password@123',
      fullName: 'Nguyen Van A',
      role: RoleName.CLIENT,
    };

    const validOtpRecord = {
      id: 1,
      email: 'newclient@frevia.com',
      code: '123456',
      type: TypeOfVerificationCode.EMAIL_VERIFICATION,
      attempts: 1,
      expiresAt: futureDate,
      createdAt: new Date(),
    };

    // UF-40: Đăng ký thành công tài khoản mới với email, mật khẩu mạnh và mã OTP hợp lệ.
    it('creates a new user account when email, password, and OTP verification code are valid', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findVerificationCode.mockResolvedValue(validOtpRecord);
      sharedRoleRepository.getClientRoleId.mockResolvedValue(2);
      hashingService.hash.mockResolvedValue('hashed-pwd');
      authRepository.createUserAndRegister.mockResolvedValue({
        id: 100,
        email: 'newclient@frevia.com',
        isBanned: false,
      });

      const result = await service.register(validRegisterBody);

      expect(result).toEqual({
        id: 100,
        email: 'newclient@frevia.com',
        isBanned: false,
      });
      expect(authRepository.createUserAndRegister).toHaveBeenCalled();
    });

    // Báo lỗi 422 UnprocessableEntityException khi email đăng ký đã tồn tại trong hệ thống.
    it('throws UnprocessableEntityException when the email is already registered', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        id: 5,
        email: 'newclient@frevia.com',
        isBanned: false,
      });

      await expect(service.register(validRegisterBody)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    // Báo lỗi 422 UnprocessableEntityException khi mã xác thực OTP không tồn tại hoặc sai.
    it('throws UnprocessableEntityException when the OTP verification code is invalid', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findVerificationCode.mockResolvedValue(null);

      await expect(
        service.register({ ...validRegisterBody, code: '000000' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    // Báo lỗi 422 UnprocessableEntityException khi mã OTP đã quá thời hạn hiệu lực.
    it('throws UnprocessableEntityException when the OTP verification code has expired', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findVerificationCode.mockResolvedValue({
        ...validOtpRecord,
        expiresAt: pastDate,
      });

      await expect(service.register(validRegisterBody)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    // Chặn đăng ký với lỗi 403 Forbidden nếu email thuộc về tài khoản đã bị khóa.
    it('throws ForbiddenException when a banned email attempts to register again', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        id: 9,
        email: 'newclient@frevia.com',
        isBanned: true,
      });

      await expect(service.register(validRegisterBody)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    // Chấp nhận mật khẩu ở biên tối thiểu 8 ký tự và băm mật khẩu trước khi lưu.
    it('accepts an 8-character boundary password and hashes it before persistence', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findVerificationCode.mockResolvedValue(validOtpRecord);
      sharedRoleRepository.getClientRoleId.mockResolvedValue(2);
      hashingService.hash.mockResolvedValue('hashed-8char');
      authRepository.createUserAndRegister.mockResolvedValue({
        id: 101,
        email: 'newclient@frevia.com',
        isBanned: false,
      });

      await service.register({ ...validRegisterBody, password: 'Ab1@5678' });

      expect(hashingService.hash).toHaveBeenCalledWith('Ab1@5678');
    });

    // Truyền đúng loại mã xác thực EMAIL_VERIFICATION khi kiểm tra OTP đăng ký.
    it('verifies the OTP with EMAIL_VERIFICATION type during registration', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findVerificationCode.mockResolvedValue(validOtpRecord);
      sharedRoleRepository.getClientRoleId.mockResolvedValue(2);
      hashingService.hash.mockResolvedValue('hashed-pwd');
      authRepository.createUserAndRegister.mockResolvedValue({
        id: 102,
        email: 'newclient@frevia.com',
        isBanned: false,
      });

      await service.register(validRegisterBody);

      expect(authRepository.findVerificationCode).toHaveBeenCalledWith({
        email: 'newclient@frevia.com',
        code: '123456',
        type: TypeOfVerificationCode.EMAIL_VERIFICATION,
      });
    });

    // Gán đúng roleId của Client khi người dùng chọn vai trò Client lúc đăng ký.
    it('assigns the Client role ID when registering with Client role', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findVerificationCode.mockResolvedValue(validOtpRecord);
      sharedRoleRepository.getClientRoleId.mockResolvedValue(2);
      hashingService.hash.mockResolvedValue('hashed-pwd');
      authRepository.createUserAndRegister.mockResolvedValue({
        id: 103,
        email: 'newclient@frevia.com',
        isBanned: false,
      });

      await service.register({ ...validRegisterBody, role: RoleName.CLIENT });

      expect(sharedRoleRepository.getClientRoleId).toHaveBeenCalled();
      expect(authRepository.createUserAndRegister).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ roleId: 2 }),
      );
    });

    // Gán đúng roleId của Freelancer khi người dùng chọn vai trò Freelancer lúc đăng ký.
    it('assigns the Freelancer role ID when registering with Freelancer role', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findVerificationCode.mockResolvedValue(validOtpRecord);
      sharedRoleRepository.getFreelancerRoleId.mockResolvedValue(3);
      hashingService.hash.mockResolvedValue('hashed-pwd');
      authRepository.createUserAndRegister.mockResolvedValue({
        id: 104,
        email: 'newclient@frevia.com',
        isBanned: false,
      });

      await service.register({
        ...validRegisterBody,
        role: RoleName.FREELANCER,
      });

      expect(sharedRoleRepository.getFreelancerRoleId).toHaveBeenCalled();
      expect(authRepository.createUserAndRegister).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ roleId: 3 }),
      );
    });

    // Hỗ trợ nhánh tra cứu Admin roleId khi tham số role khác Client và Freelancer.
    it('resolves the fallback role ID when a non-client and non-freelancer role is passed', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findVerificationCode.mockResolvedValue(validOtpRecord);
      sharedRoleRepository.getAdminRoleId.mockResolvedValue(1);
      hashingService.hash.mockResolvedValue('hashed-pwd');
      authRepository.createUserAndRegister.mockResolvedValue({
        id: 105,
        email: 'newclient@frevia.com',
        isBanned: false,
      });

      await service.register({
        ...validRegisterBody,
        role: RoleName.ADMIN as unknown as typeof validRegisterBody.role,
      });

      expect(sharedRoleRepository.getAdminRoleId).toHaveBeenCalled();
    });

    // Lưu đúng họ tên đầy đủ (fullName) của người dùng vào hồ sơ khi khởi tạo tài khoản.
    it('passes the user fullName to repository when creating the account', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findVerificationCode.mockResolvedValue(validOtpRecord);
      sharedRoleRepository.getClientRoleId.mockResolvedValue(2);
      hashingService.hash.mockResolvedValue('hashed-pwd');
      authRepository.createUserAndRegister.mockResolvedValue({
        id: 106,
        email: 'newclient@frevia.com',
        isBanned: false,
      });

      await service.register({
        ...validRegisterBody,
        fullName: 'Tran Thi B',
      });

      expect(authRepository.createUserAndRegister).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ fullName: 'Tran Thi B' }),
      );
    });

    // Chuyển đổi lỗi trùng khóa duy nhất Prisma P2002 thành ConflictException khi xảy ra race condition.
    it('throws ConflictException when a Prisma P2002 unique constraint violation occurs', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findVerificationCode.mockResolvedValue(validOtpRecord);
      sharedRoleRepository.getClientRoleId.mockResolvedValue(2);
      hashingService.hash.mockResolvedValue('hashed-pwd');
      authRepository.createUserAndRegister.mockRejectedValue(
        new PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.0.0',
        }),
      );

      await expect(service.register(validRegisterBody)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    // Ném lỗi hệ thống khi cơ sở dữ liệu mất kết nối trong quá trình tạo tài khoản.
    it('propagates database connection error during user registration', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      authRepository.findVerificationCode.mockResolvedValue(validOtpRecord);
      sharedRoleRepository.getClientRoleId.mockResolvedValue(2);
      hashingService.hash.mockResolvedValue('hashed-pwd');
      authRepository.createUserAndRegister.mockRejectedValue(
        new InternalServerErrorException('Database connection error'),
      );

      await expect(service.register(validRegisterBody)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe('UF-41 forgotPassword', () => {
    const forgotPayload = {
      email: 'user@frevia.com',
      code: '654321',
      newPassword: 'NewPassword@123',
      confirmNewPassword: 'NewPassword@123',
    };

    const validResetOtp = {
      id: 10,
      email: 'user@frevia.com',
      code: '654321',
      type: TypeOfVerificationCode.PASSWORD_RESET,
      attempts: 1,
      expiresAt: futureDate,
      createdAt: new Date(),
    };

    // UF-41: Đặt lại mật khẩu mới thành công và xóa mã OTP sau khi xác minh hợp lệ.
    it('updates the user password and deletes the OTP record when verification succeeds', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 7,
        email: 'user@frevia.com',
        isBanned: false,
      });
      authRepository.findVerificationCode.mockResolvedValue(validResetOtp);
      hashingService.hash.mockResolvedValue('new-hashed-password');
      authRepository.update.mockResolvedValue({ id: 7 });
      authRepository.deleteVerifycationCode.mockResolvedValue({ id: 10 });

      const result = await service.forgotPassword(forgotPayload);

      expect(authRepository.update).toHaveBeenCalledWith(
        { id: 7 },
        { password: 'new-hashed-password' },
      );
      expect(authRepository.deleteVerifycationCode).toHaveBeenCalledWith({
        email: 'user@frevia.com',
        type: TypeOfVerificationCode.PASSWORD_RESET,
      });
      expect(result).toEqual({ message: 'Update password successfully' });
    });

    // Báo lỗi 422 UnprocessableEntityException khi email yêu cầu đặt lại mật khẩu không tồn tại.
    it('throws UnprocessableEntityException when the account email does not exist', async () => {
      authRepository.findUserForLogin.mockResolvedValue(null);

      await expect(
        service.forgotPassword({
          ...forgotPayload,
          email: 'nonexistent@frevia.com',
        }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    // Báo lỗi 422 UnprocessableEntityException khi mã OTP đặt lại mật khẩu không chính xác.
    it('throws UnprocessableEntityException when the password reset OTP code is invalid', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 7,
        email: 'user@frevia.com',
        isBanned: false,
      });
      authRepository.findVerificationCode.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ ...forgotPayload, code: '999999' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    // Báo lỗi 422 UnprocessableEntityException khi mã OTP đặt lại mật khẩu đã hết hạn.
    it('throws UnprocessableEntityException when the password reset OTP code has expired', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 7,
        email: 'user@frevia.com',
        isBanned: false,
      });
      authRepository.findVerificationCode.mockResolvedValue({
        ...validResetOtp,
        expiresAt: pastDate,
      });

      await expect(
        service.forgotPassword(forgotPayload),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    // Chặn đặt lại mật khẩu với lỗi 403 Forbidden khi tài khoản người dùng đang bị khóa.
    it('throws ForbiddenException when a banned user attempts to reset their password', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 7,
        email: 'user@frevia.com',
        isBanned: true,
      });

      await expect(
        service.forgotPassword(forgotPayload),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // Chuyển tiếp ngoại lệ khi cập nhật mật khẩu hoặc xóa OTP trong cơ sở dữ liệu thất bại.
    it('propagates error when updating the password in the database fails', async () => {
      authRepository.findUserForLogin.mockResolvedValue({
        id: 7,
        email: 'user@frevia.com',
        isBanned: false,
      });
      authRepository.findVerificationCode.mockResolvedValue(validResetOtp);
      hashingService.hash.mockResolvedValue('new-hashed-password');
      authRepository.update.mockRejectedValue(
        new InternalServerErrorException('Database update error'),
      );

      await expect(
        service.forgotPassword(forgotPayload),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('getMe', () => {
    const mockUserWithPermissions = {
      id: 10,
      email: 'cskh@frevia.com',
      isBanned: false,
      deletedAt: null,
      profile: {
        id: 1,
        displayName: 'CSKH Officer',
        avatarUrl: null,
      },
      role: {
        id: 5,
        name: 'CSKH',
        description: 'Customer Support Staff',
        rolePermissions: [
          {
            permission: {
              id: 101,
              method: 'GET',
              path: '/api/users',
              module: 'USERS',
              deletedAt: null,
            },
          },
          {
            permission: {
              id: 102,
              method: 'GET',
              path: '/api/forums/reports',
              module: 'FORUMS',
              deletedAt: null,
            },
          },
        ],
      },
    };

    it('returns user info with dynamic role, permissions and permissionModules', async () => {
      authRepository.findUserById.mockResolvedValue(mockUserWithPermissions);

      const result = await service.getMe(10, 5);

      expect(result.id).toBe(10);
      expect(result.email).toBe('cskh@frevia.com');
      expect(result.roles[0].name).toBe('CSKH');
      expect(result.permissions).toContain('GET /api/users');
      expect(result.permissions).toContain('/api/users');
      expect(result.permissions).toContain('GET /api/forums/reports');
      expect(result.permissionModules).toContain('USERS');
      expect(result.permissionModules).toContain('FORUMS');
    });

    it('returns wildcard permission for ADMIN role', async () => {
      const mockAdminUser = {
        id: 1,
        email: 'admin@frevia.com',
        isBanned: false,
        deletedAt: null,
        profile: null,
        role: {
          id: 1,
          name: RoleName.ADMIN,
          description: 'Super Administrator',
          rolePermissions: [],
        },
      };
      authRepository.findUserById.mockResolvedValue(mockAdminUser);

      const result = await service.getMe(1, 1);

      expect(result.permissions).toContain('*');
    });

    it('throws NotFoundException when user does not exist', async () => {
      authRepository.findUserById.mockResolvedValue(null);

      await expect(service.getMe(999)).rejects.toThrow();
    });

    it('throws ForbiddenException when user is banned', async () => {
      authRepository.findUserById.mockResolvedValue({
        id: 2,
        email: 'banned@frevia.com',
        isBanned: true,
        deletedAt: null,
      });

      await expect(service.getMe(2)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
