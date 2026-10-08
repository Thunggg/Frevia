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
        this.logger.error(`ZodSerializationException: ${zodError.message}`);
      }
    } else if (exception instanceof HttpException) {
      const body: HttpExceptionBody = {
        ...(exception.getResponse() as object),
      } as HttpExceptionBody;

      const apiRes: ApiError = {
        success: false,
        error: {
          code: String(body.statusCode),
          message: body.error!,
          details: body.message as unknown as ValidationIssue[],
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
