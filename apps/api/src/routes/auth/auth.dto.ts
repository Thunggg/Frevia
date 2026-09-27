import {
  LoginBodySchema,
  LoginResSchema,
  LogoutBodySchema,
  MessageResSchema,
  RefreshTokenBodySchema,
  RegisterBodySchema,
  RegisterResSchema,
  SendOTPSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class RegisterDto extends createZodDto(RegisterBodySchema) {}
export class RegisterResponseDto extends createZodDto(RegisterResSchema) {}

export class SendOTPBodyDTO extends createZodDto(SendOTPSchema) {}
export class SendOTPResponseDTO extends createZodDto(MessageResSchema) {}

export class LoginBodyDTO extends createZodDto(LoginBodySchema) {}
export class LoginResponseDto extends createZodDto(LoginResSchema) {}

export class RefreshTokenBodyDTO extends createZodDto(RefreshTokenBodySchema) {}

export class LogoutBodyDTO extends createZodDto(LogoutBodySchema) {}
