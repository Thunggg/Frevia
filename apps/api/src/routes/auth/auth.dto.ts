import {
  MessageResSchema,
  RegisterBodySchema,
  RegisterResSchema,
  SendOTPSchema,
} from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class RegisterDto extends createZodDto(RegisterBodySchema) {}
export class RegisterResponseDto extends createZodDto(RegisterResSchema) {}

export class SendOTPBodyDTO extends createZodDto(SendOTPSchema) {}
export class SendOTPResponseDTO extends createZodDto(MessageResSchema) {}
