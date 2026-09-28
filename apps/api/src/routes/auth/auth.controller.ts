import { Body, Controller, Get, Ip, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
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

  @Get('me')
  getMe(@UserActive('userId') userId: number) {
    return this.authService.getMe(userId);
  }
}
