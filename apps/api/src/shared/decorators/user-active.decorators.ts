import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload, REQUEST_USER_KEY } from '@shared/types';

export const UserActive = createParamDecorator(
  (field: keyof AccessTokenPayload, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const payload = request[REQUEST_USER_KEY] as AccessTokenPayload;

    return payload[field];
  },
);
