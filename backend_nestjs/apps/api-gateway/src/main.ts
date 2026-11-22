import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { ApiGatewayModule } from './api-gateway.module';

type Role = 'QTV' | 'GV' | 'SV';
const ALL: Role[] = ['QTV', 'GV', 'SV'];

// Luật phân quyền theo đường dẫn + phương thức. Luật khớp đầu tiên được dùng.
// Tuyến không khớp luật nào: chỉ cần đăng nhập. Từng dịch vụ vẫn kiểm tra lại
// quyền sở hữu dữ liệu (vd: GV chỉ duyệt đăng ký của đề tài mình).
interface Rule {
  methods?: string[];
  pattern: RegExp;
  roles: Role[];
}
const READ = ['GET', 'HEAD'];
const rules: Rule[] = [
  // Tài khoản
  { pattern: /^\/tai-khoan\/me\/mat-khau$/, roles: ALL },
  { pattern: /^\/tai-khoan(\/|$)/, roles: ['QTV'] },
  // Nhật ký: chỉ QTV
  { pattern: /^\/nhat-ky(\/|$)/, roles: ['QTV'] },
  // Học vụ + đợt đề tài: mọi vai trò xem, QTV ghi
  {
    methods: READ,
    pattern: /^\/(sinh-vien|khoa|nganh|giang-vien|dot-de-tai)(\/|$)/,
    roles: ALL,
  },
  {
    pattern: /^\/(sinh-vien|khoa|nganh|giang-vien|dot-de-tai)(\/|$)/,
    roles: ['QTV'],
  },
  // Đề tài
  { pattern: /^\/de-tai\/[^/]+\/(duyet|tu-choi|dong|mo)$/, roles: ['QTV'] },
  { pattern: /^\/de-tai\/[^/]+\/ho-so$/, roles: ALL },
  { methods: READ, pattern: /^\/de-tai(\/|$)/, roles: ALL },
  { pattern: /^\/de-tai(\/|$)/, roles: ['GV', 'QTV'] },
  // Đăng ký
  { methods: READ, pattern: /^\/dang-ky(\/|$)/, roles: ALL },
  { pattern: /^\/dang-ky\/[^/]+\/huy$/, roles: ['SV', 'QTV'] },
  { pattern: /^\/dang-ky\/[^/]+\/(duyet|tu-choi)$/, roles: ['GV'] },
  { methods: ['POST'], pattern: /^\/dang-ky\/?$/, roles: ['SV', 'QTV'] }, // QTV: tạm, cho trang quản lý hiện tại
  { pattern: /^\/dang-ky(\/|$)/, roles: ['QTV'] },
  // Hội đồng nghiệm thu
  { pattern: /^\/hoi-dong\/[^/]+\/(diem|chot-diem)$/, roles: ['GV'] },
  { methods: READ, pattern: /^\/hoi-dong(\/|$)/, roles: ['GV', 'QTV'] },
  { pattern: /^\/hoi-dong(\/|$)/, roles: ['QTV'] },
  // Báo cáo
  { pattern: /^\/bao-cao\/sinh-vien(\/|$)/, roles: ['QTV'] },
  { pattern: /^\/bao-cao\/gio-nckh(\/|$)/, roles: ['GV', 'QTV'] },
  // AI
  { pattern: /^\/ai\/(goi-y-hoi-dong|nap-kho)(\/|$)/, roles: ['QTV'] },
  { pattern: /^\/ai(\/|$)/, roles: ['GV', 'QTV'] },
];

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule, { bodyParser: false });
  const config = app.get(ConfigService);

  // CORS tập trung tại Gateway. Phải đăng ký trước mọi middleware khác để
  // preflight (OPTIONS) được trả lời ngay, không bị chuyển tiếp xuống dịch vụ.
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
    exposedHeaders: ['X-Correlation-Id'],
  });

  const jwt = app.get(JwtService);
  const secret = config.get<string>('JWT_ACCESS_SECRET');

  const url = (key: string, def: string) => config.get<string>(key) ?? def;
  const AUTH = url('AUTH_SERVICE_URL', 'http://localhost:3004');
  const ACADEMIC = url('SINHVIEN_SERVICE_URL', 'http://localhost:3001');
  const TOPIC = url('DETAI_SERVICE_URL', 'http://localhost:3002');
  const REG = url('DANGKY_SERVICE_URL', 'http://localhost:3003');
  const NOTI = url('NOTIFICATION_SERVICE_URL', 'http://localhost:3005');
  const REPORT = url('REPORT_SERVICE_URL', 'http://localhost:3006');
  const AI = url('AI_SERVICE_URL', 'http://localhost:3007');

  const targets: Record<string, string> = {
    '/auth': AUTH,
    '/tai-khoan': AUTH,
    '/sinh-vien': ACADEMIC,
    '/khoa': ACADEMIC,
    '/nganh': ACADEMIC,
    '/giang-vien': ACADEMIC,
    '/de-tai': TOPIC,
    '/dot-de-tai': TOPIC,
    '/hoi-dong': TOPIC,
    '/dang-ky': REG,
    '/thong-bao': NOTI,
    '/nhat-ky': NOTI,
    '/bao-cao': REPORT,
    '/ai': AI,
  };
  const publicPaths = ['/auth/login', '/auth/refresh'];

  const cleanPath = (u: string) => {
    const p = u.split('?')[0];
    return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
  };

  const findTarget = (u: string): string | undefined => {
    const path = cleanPath(u);
    const prefix = Object.keys(targets).find(
      (p) => path === p || path.startsWith(p + '/'),
    );
    return prefix ? targets[prefix] : undefined;
  };

  const sendError = (
    res: Response,
    statusCode: number,
    error: string,
    message: string,
    code?: string,
  ) =>
    res.status(statusCode).json({
      statusCode,
      ...(code ? { code } : {}),
      error,
      message,
      path: res.req.originalUrl,
      timestamp: new Date().toISOString(),
      correlationId: res.getHeader('X-Correlation-Id'),
    });

  const server = app.getHttpAdapter().getInstance();

  // 1. X-Correlation-Id: dùng id client gửi lên hoặc sinh mới; chuyển tiếp xuống dịch vụ
  server.use((req: Request, res: Response, next: NextFunction) => {
    const id = (req.headers['x-correlation-id'] as string) || randomUUID();
    req.headers['x-correlation-id'] = id;
    res.setHeader('X-Correlation-Id', id);
    next();
  });

  // 2. Nhật ký truy cập
  server.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(
        `[gateway] ${res.getHeader('X-Correlation-Id')} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`,
      );
    });
    next();
  });

  // 3. Giới hạn yêu cầu theo IP (P-09), mặc định 100 yêu cầu / phút
  const limit = Number(config.get('RATE_LIMIT_PER_MIN') ?? 100);
  const hits = new Map<string, { count: number; reset: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, h] of hits) if (h.reset <= now) hits.delete(ip);
  }, 60_000).unref();
  server.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') return next();
    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    let h = hits.get(ip);
    if (!h || h.reset <= now) {
      h = { count: 0, reset: now + 60_000 };
      hits.set(ip, h);
    }
    h.count += 1;
    if (h.count > limit) {
      res.setHeader('Retry-After', Math.ceil((h.reset - now) / 1000));
      return sendError(
        res,
        429,
        'Too Many Requests',
        'Quá nhiều yêu cầu, hãy thử lại sau',
        'QUA_NHIEU_YEU_CAU',
      );
    }
    next();
  });

  // 4. Không có tuyến nào khớp
  server.use((req: Request, res: Response, next: NextFunction) => {
    if (!findTarget(req.originalUrl)) {
      return sendError(res, 404, 'Not Found', 'Không tìm thấy dịch vụ');
    }
    next();
  });

  // 5. Xác thực JWT + kiểm tra vai trò theo tuyến
  server.use(async (req: Request, res: Response, next: NextFunction) => {
    const path = cleanPath(req.originalUrl);
    if (req.method === 'OPTIONS' || publicPaths.includes(path)) return next();

    const [type, token] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) {
      return sendError(res, 401, 'Unauthorized', 'Thiếu token');
    }
    let payload: { role?: Role };
    try {
      payload = await jwt.verifyAsync(token, { secret });
    } catch {
      return sendError(
        res,
        401,
        'Unauthorized',
        'Token không hợp lệ hoặc đã hết hạn',
      );
    }

    const rule = rules.find(
      (r) =>
        r.pattern.test(path) && (!r.methods || r.methods.includes(req.method)),
    );
    if (rule && (!payload.role || !rule.roles.includes(payload.role))) {
      return sendError(
        res,
        403,
        'Forbidden',
        'Không đủ quyền truy cập',
        'KHONG_DU_QUYEN',
      );
    }
    next();
  });

  // 6. Chuyển tiếp (giữ nguyên header Authorization và X-Correlation-Id)
  server.use(
    createProxyMiddleware({
      target: AUTH,
      changeOrigin: true,
      router: (req) => findTarget(req.url ?? '') as string,
      on: {
        error: (_err, _req, res) => {
          const r = res as unknown as Response;
          if (!r.headersSent) {
            sendError(
              r,
              503,
              'Service Unavailable',
              'Dịch vụ phía sau không phản hồi',
              'DICH_VU_KHONG_PHAN_HOI',
            );
          }
        },
      },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API Gateway đang chạy ở cổng ${port}`);
}
bootstrap();
