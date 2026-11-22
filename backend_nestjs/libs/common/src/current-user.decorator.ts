import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  sub: string; // mã tài khoản
  username: string;
  role: 'QTV' | 'GV' | 'SV';
  maDinhDanh?: string; // MaGV hoặc MaSV; QTV để trống
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user: CurrentUserPayload = req.user;
    return data ? user?.[data] : user;
  },
);
