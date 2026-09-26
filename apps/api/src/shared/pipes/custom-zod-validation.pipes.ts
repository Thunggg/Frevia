import { BadRequestException } from '@nestjs/common';
import { ApiError, ValidationIssue } from '@shared/types';
import { createZodValidationPipe, ZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

export const MyZodValidationPipe: typeof ZodValidationPipe =
  createZodValidationPipe({
    createValidationException: (error: unknown) => {
      if (error instanceof ZodError) {
        const issues: ValidationIssue[] = error.issues.map((e) => {
          return {
            code: e.code,
            path: e.path.join('.'),
            message: e.message,
          };
        });

        const res: ApiError = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: issues,
          },
        };

        return new BadRequestException(res);
      }
      return new BadRequestException(
        error instanceof Error ? error.message : 'Unknown validation error',
      );
    },
  });
