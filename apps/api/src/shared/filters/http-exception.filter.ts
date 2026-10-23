import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpExceptionBody,
  Logger,
} from '@nestjs/common';
import { ApiError, ManageConversationMessage } from '@shared/types';
import { Response } from 'express';
import { ZodSerializationException } from 'nestjs-zod';
import { ZodError } from 'zod';

interface ValidationIssue {
  message: string;
  path: string;
}

// Multer ném lỗi này khi file vượt quá giới hạn dung lượng
const isMulterFileSizeError = (exception: unknown): boolean =>
  exception instanceof Error &&
  'code' in exception &&
  (exception as { code?: string }).code === 'LIMIT_FILE_SIZE';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ZodSerializationException) {
      const zodError = (exception as ZodSerializationException).getZodError();
      if (zodError instanceof ZodError) {
        this.logger.error(
          `ZodSerializationException: ${zodError.message}`,
          zodError.issues,
        );
      }

      const apiRes: ApiError = {
        success: false,
        error: {
          code: String(500),
          message: 'Response validation failed',
          details:
            zodError instanceof ZodError
              ? zodError.issues.map((issue) => ({
                  message: issue.message,
                  path: issue.path.join('.'),
                }))
              : undefined,
        },
        timestamp: new Date().toISOString(),
      };

      response.status(500).json(apiRes);
    } else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      let errorMsg = exception.message;
      let errorCode = String(exception.getStatus());
      let details: ValidationIssue[] | undefined = undefined;

      if (typeof res === 'string') {
        errorMsg = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        if (typeof resObj.message === 'string') {
          errorMsg = resObj.message;
        } else if (Array.isArray(resObj.message)) {
          details = resObj.message as unknown as ValidationIssue[];
          errorMsg =
            typeof resObj.error === 'string'
              ? resObj.error
              : 'Validation failed';
        } else if (typeof resObj.error === 'string') {
          errorMsg = resObj.error;
        }
        if (resObj.statusCode) {
          errorCode = String(resObj.statusCode);
        }
      }

      const apiRes: ApiError = {
        success: false,
        error: {
          code: errorCode,
          message: errorMsg,
          details,
        },
        timestamp: new Date().toISOString(),
      };

      response.status(exception.getStatus()).json(apiRes);
    } else if (isMulterFileSizeError(exception)) {
      const apiRes: ApiError = {
        success: false,
        error: {
          code: '413',
          message: ManageConversationMessage.FILE_TOO_LARGE,
        },
        timestamp: new Date().toISOString(),
      };

      response.status(413).json(apiRes);
    } else {
      const apiRes: ApiError = {
        success: false,
        error: {
          code: String(500),
          message: (exception as Error).message,
        },
        timestamp: new Date().toISOString(),
      };
      response.status(500).json(apiRes);
      this.logger.error(exception);
    }
  }
}
