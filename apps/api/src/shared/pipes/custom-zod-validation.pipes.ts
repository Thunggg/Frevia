import { HttpStatus } from '@nestjs/common';
import { ErrorCode, ValidationIssue } from '@shared/types';
import { createZodValidationPipe, ZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';
import { AppException } from '../exceptions/app.exception';

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

        return new AppException(
          ErrorCode.VALIDATION_ERROR as string,
          'Validation failed',
          HttpStatus.BAD_REQUEST,
          issues,
        );
      }
      return new AppException(
        ErrorCode.INTERNAL_SERVER_ERROR as string,
        error instanceof Error ? error.message : 'Unknown validation error',
        HttpStatus.BAD_REQUEST,
        [],
      );
    },
  });
