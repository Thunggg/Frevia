import { RegisterBodySchema, RegisterResSchema } from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class RegisterDto extends createZodDto(RegisterBodySchema) {}
export class RegisterResponseDto extends createZodDto(RegisterResSchema) {}
