// shared/exceptions/app.exception.ts
import { HttpException } from '@nestjs/common';
import { ApiError, ValidationIssue } from '@shared/types';

export class AppException extends HttpException {
  constructor(
    code: string,
    message: string,
    status: number,
    details?: ValidationIssue[],
  ) {
    const body: ApiError = {
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString(),
    };

    super(body, status);
  }
}
