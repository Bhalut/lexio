import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AuthRequest } from './auth-request.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    return request.currentUser ?? null;
  },
);
