import { Body, Controller, Get, Ip, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import ms from 'ms';
import { ZodSerializerDto } from 'nestjs-zod';
import { envConfig } from '../../shared/config/validate-env';
import { IsPublic } from '../../shared/decorators/auth.decorator';
import { UserActive } from '../../shared/decorators/user-active.decorators';
import { UserAgent } from '../../shared/decorators/user-agent.decorators';
import { MessageResDTO } from '../../shared/dtos/response.dto';
import {
  ForgotPasswordBodyDTO,
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
    @Res({ passthrough: true }) res: Response,
    @UserAgent() userAgent: string,
    @Ip() ipAddress: string,
  ) {
    const result = await this.authService.login({
      ...body,
      userAgent,
      ipAddress,
    });

    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: false, // nếu true thì cookie chỉ gửi được qua https
      sameSite: 'strict', // Cookie chỉ được gửi nếu người dùng đang ở đúng website đó.
      expires: new Date(
        (Date.now() + ms(envConfig.ACCESS_TOKEN_EXPIRES_IN)) as string,
      ),
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      expires: new Date(
        (Date.now() + ms(envConfig.REFRESH_TOKEN_EXPIRES_IN)) as string,
      ),
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

  @Get('test')
  test() {
    return { message: 'Hello' };
  }
}
