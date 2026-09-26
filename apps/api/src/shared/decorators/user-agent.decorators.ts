import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserAgent = createParamDecorator(
  (_data: string, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const userAgent = request.headers['user-agent'] as string;

    return userAgent;
  },
);
