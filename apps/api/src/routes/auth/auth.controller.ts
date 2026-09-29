import { Body, Controller, Get, Ip, Post, Query, Res } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { UserAgent } from '../../shared/decorators/user-agent.decorators';
import { MessageResDTO } from '../../shared/dtos/response.dto';
import {
  ForgotPasswordBodyDTO,
  GetAuthorizationUrlResponseDTO,
  LoginBodyDTO,
  LoginResponseDto,
  LogoutBodyDTO,
  RefreshTokenBodyDTO,
  RegisterDto,
  RegisterResponseDto,
  SendOTPBodyDTO,
  SendOTPResponseDTO,
} from './auth.dto';
import { AuthService } from './auth.service';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResponseDto)
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(SendOTPResponseDTO)
  async sendOTP(@Body() body: SendOTPBodyDTO) {
    return await this.authService.sendOTP(body);
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
      ...body,
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
      ...body,
      userAgent,
      ipAddress,
    });
  }

  @Post('logout')
  @ZodSerializerDto(MessageResDTO)
  async logout(
    @Body() body: LogoutBodyDTO,
    @UserActive('userId') userId: number,
  ) {
    return await this.authService.logout(body.refreshToken as string, userId);
  }

  @Post('forgot-password')
  @IsPublic()
  @ZodSerializerDto(MessageResDTO)
  async forgotPassword(@Body() body: ForgotPasswordBodyDTO) {
    return this.authService.forgotPassword(body);
  }

  @Get('google-link')
  @IsPublic()
  @ZodSerializerDto(GetAuthorizationUrlResponseDTO)
  getGoogleLink(@UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.getAuthorizationUrl({ userAgent, ip });
  }

  @Get('google/callback')
  @IsPublic()
  @ZodSerializerDto(LoginResponseDto)
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const data = await this.authService.googleCallback({ code, state });

      return res.redirect(
        `http://localhost:3001/api/auth/google?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`,
      );
    } catch (error) {
      console.log(error);
    }
  }

  @Get('me')
  getMe(@UserActive('userId') userId: number) {
    return this.authService.getMe(userId);
  }
}
