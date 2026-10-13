import {
  Body,
  Controller,
  Get,
  Ip,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type {
  ForgotPasswordBodyType,
  LoginBodyType,
  LogoutBodySchemaType,
  RefreshTokenBodySchemaType,
  RegisterBodyType,
  SendOTPBodyType,
  SwitchRoleBodyType,
} from '@shared/types';
import type { Response } from 'express';
import { ZodSerializerDto } from 'nestjs-zod';
import { envConfig } from '../../shared/config/validate-env';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { UserAgent } from '../../shared/decorators/user-agent.decorators';
import { MessageResDTO } from '../../shared/dtos/response.dto';
import {
  ForgotPasswordBodyDTO,
  GetAuthorizationUrlResponseDTO,
  GetMeResponseDto,
  LoginBodyDTO,
  LoginResponseDto,
  LogoutBodyDTO,
  RefreshTokenBodyDTO,
  RegisterDto,
  RegisterResponseDto,
  SendOTPBodyDTO,
  SendOTPResponseDTO,
  SwitchRoleBodyDto,
  SwitchRoleResponseDto,
} from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResponseDto)
  register(@Body() body: RegisterDto) {
    return this.authService.register(body as RegisterBodyType);
  }

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(SendOTPResponseDTO)
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return await this.authService.sendOTP(body as SendOTPBodyType);
  }

  @Post('login')
  @IsPublic()
  @ZodSerializerDto(LoginResponseDto)
  async login(
    @Body() body: LoginBodyDTO,
    @UserAgent() userAgent: string,
    @Ip() ipAddress: string,
  ) {
    const result = await this.authService.login({
      ...(body as LoginBodyType),
      userAgent,
      ipAddress,
    });

    return result;
  }

  @Post('refresh-token')
  @IsPublic()
  @ZodSerializerDto(LoginResponseDto)
  async refreshToken(
    @Body() body: RefreshTokenBodyDTO,
    @UserAgent() userAgent: string,
    @Ip() ipAddress: string,
  ) {
    return await this.authService.refreshToken({
      ...(body as RefreshTokenBodySchemaType),
      userAgent,
      ipAddress,
    });
  }

  @Post('logout')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  async logout(@Body() body: LogoutBodyDTO) {
    return await this.authService.logout(
      (body as LogoutBodySchemaType).refreshToken,
    );
  }

  @Post('forgot-password')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  async forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    return this.authService.forgotPassword(body as ForgotPasswordBodyType);
  }

  @Get('google-link')
  @IsPublic()
  @ZodSerializerDto(GetAuthorizationUrlResponseDTO)
  getGoogleLink(@UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.getAuthorizationUrl({ userAgent, ip });
  }

  @Get('google/callback')
  @IsPublic()
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const data = await this.authService.googleCallback({ code, state });
      const params = new URLSearchParams({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      res.redirect(`${envConfig.NEXT_URL}/api/auth/google?${params.toString()}`);
    } catch (error) {
      this.logger.error('Google OAuth callback failed', error);
      res.redirect(`${envConfig.NEXT_URL}/login?error=google`);
    }
  }

  @Get('me')
  @ZodSerializerDto(GetMeResponseDto)
  getMe(@UserActive('userId') userId: number) {
    return this.authService.getMe(userId);
  }

  @Post('switch-role')
  @ZodSerializerDto(SwitchRoleResponseDto)
  switchRole(
    @UserActive('userId') userId: number,
    @UserActive('sessionId') sessionId: number,
    @Body() body: SwitchRoleBodyDto,
  ) {
    return this.authService.switchRole(
      userId,
      sessionId,
      body as SwitchRoleBodyType,
    );
  }
}
