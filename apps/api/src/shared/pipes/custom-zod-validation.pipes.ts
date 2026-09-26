import { UnprocessableEntityException } from '@nestjs/common';
import { ValidationIssue } from '@shared/types';
import { createZodValidationPipe, ZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';
import { ServerErrorException } from '../errors/shared-message.error';

export const MyZodValidationPipe: typeof ZodValidationPipe =
  createZodValidationPipe({
    createValidationException: (error: unknown) => {
      if (error instanceof ZodError) {
        const issues: ValidationIssue[] = error.issues.map((e) => {
          return {
            path: e.path.join('.'),
            message: e.message,
          };
        });

        return new UnprocessableEntityException(issues);
      }

      throw ServerErrorException;
    },
  });
