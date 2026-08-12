import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthRequest } from '../auth.request';

export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthRequest>();
    return request.user?.sub;
  },
);
