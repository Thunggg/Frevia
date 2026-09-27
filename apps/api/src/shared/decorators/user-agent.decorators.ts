import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserAgent = createParamDecorator(
  (_data: string, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    const userAgent: string | null = request.headers['user-agent'] ?? null;

    return userAgent;
  },
);
