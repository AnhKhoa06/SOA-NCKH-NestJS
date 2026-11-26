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
  { pattern: /^\/tai-khoan\/me(\/mat-khau)?$/, roles: ALL },
  { pattern: /^\/tai-khoan(\/|$)/, roles: ['QTV'] },
  // Nhật ký: chỉ QTV
  { pattern: /^\/nhat-ky(\/|$)/, roles: ['QTV'] },
  // Học vụ + đợt đề tài: mọi vai trò xem, tự cập nhật hồ sơ cá nhân, QTV ghi
  {
    methods: READ,
    pattern: /^\/(sinh-vien|khoa|nganh|giang-vien|lop|dot-de-tai)(\/|$)/,
    roles: ALL,
  },
  {
    methods: ['PATCH'],
    pattern: /^\/(sinh-vien|giang-vien)\/[^/]+$/,
    roles: ALL,
  },
  {
    pattern: /^\/(sinh-vien|khoa|nganh|giang-vien|lop|dot-de-tai)(\/|$)/,
    roles: ['QTV'],
  },
  // Đề tài
  { pattern: /^\/de-tai\/[^/]+\/(duyet|tu-choi|dong|mo)$/, roles: ['QTV'] },
  { pattern: /^\/de-tai\/[^/]+\/ho-so$/, roles: ['GV', 'SV'] },
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
  { pattern: /^\/bao-cao\/xuat(\/|$)/, roles: ['GV', 'QTV'] },
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
    '/lop': ACADEMIC,
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

  // 2. Nhật ký truy cập + ghi nhật ký thao tác (POST/PUT/PATCH/DELETE) sang notification-service
  const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  const tenHanhDong = (method: string, path: string): string => {
    if (path === '/auth/login') return 'DANG_NHAP';
    if (path === '/auth/logout') return 'DANG_XUAT';
    if (path === '/tai-khoan' && method === 'POST') return 'TAO_TAI_KHOAN';
    if (path === '/tai-khoan/me/mat-khau') return 'DOI_MAT_KHAU';
    if (path === '/tai-khoan/me') return 'CAP_NHAT_HO_SO';
    if (/^\/tai-khoan\/\d+\/khoa$/.test(path)) return 'KHOA_TAI_KHOAN';
    if (/^\/tai-khoan\/\d+\/mo-khoa$/.test(path)) return 'MO_KHOA_TAI_KHOAN';
    if (/^\/tai-khoan\/\d+\/dat-lai-mat-khau$/.test(path)) return 'DAT_LAI_MAT_KHAU';
    if (/^\/dang-ky\/\d+\/duyet$/.test(path)) return 'DUYET_DANG_KY';
    if (/^\/dang-ky\/\d+\/tu-choi$/.test(path)) return 'TU_CHOI_DANG_KY';
    if (/^\/dang-ky\/\d+\/huy$/.test(path)) return 'HUY_DANG_KY';
    if (path === '/dang-ky' && method === 'POST') return 'DANG_KY_DE_TAI';
    if (path.startsWith('/dang-ky/') && method === 'DELETE') return 'XOA_DANG_KY';
    if (path === '/de-tai' && method === 'POST') return 'THEM_DE_TAI';
    if (path.startsWith('/de-tai/') && (method === 'PUT' || method === 'PATCH')) return 'SUA_DE_TAI';
    if (path.startsWith('/de-tai/') && method === 'DELETE') return 'XOA_DE_TAI';
    if (path === '/sinh-vien/import') return 'IMPORT_SINH_VIEN';
    if (path === '/sinh-vien' && method === 'POST') return 'THEM_SINH_VIEN';
    if (path.startsWith('/sinh-vien/') && method === 'PATCH') return 'SUA_SINH_VIEN';
    if (path.startsWith('/sinh-vien/') && method === 'DELETE') return 'XOA_SINH_VIEN';
    if (path === '/giang-vien' && method === 'POST') return 'THEM_GIANG_VIEN';
    if (path.startsWith('/giang-vien/') && method === 'PATCH') return 'SUA_GIANG_VIEN';
    if (path.startsWith('/giang-vien/') && method === 'DELETE') return 'XOA_GIANG_VIEN';
    if (path === '/khoa' && method === 'POST') return 'THEM_KHOA';
    if (path.startsWith('/khoa/') && method === 'PATCH') return 'SUA_KHOA';
    if (path.startsWith('/khoa/') && method === 'DELETE') return 'XOA_KHOA';
    if (path === '/nganh' && method === 'POST') return 'THEM_NGANH';
    if (path.startsWith('/nganh/') && method === 'PATCH') return 'SUA_NGANH';
    if (path.startsWith('/nganh/') && method === 'DELETE') return 'XOA_NGANH';
    const seg = path.split('/')[1]?.toUpperCase().replace(/-/g, '_') || 'HE_THONG';
    const act = method === 'POST' ? 'THEM' : method === 'DELETE' ? 'XOA' : 'SUA';
    return `${act}_${seg}`;
  };

  server.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(
        `[gateway] ${res.getHeader('X-Correlation-Id')} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`,
      );
      const path = cleanPath(req.originalUrl);
      if (WRITE_METHODS.has(req.method) && path !== '/auth/refresh') {
        const user = (req as Request & { user?: { username?: string; role?: Role } }).user;
        fetch(`${NOTI}/nhat-ky/noi-bo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nguoiThucHien: user?.username || (path === '/auth/login' ? 'NGUOI_DUNG' : 'ANONYMOUS'),
            vaiTro: user?.role || null,
            hanhDong: tenHanhDong(req.method, path),
            doiTuong: path,
            ketQua: res.statusCode < 400 ? 'THANH_CONG' : 'THAT_BAI',
            diaChiIp: req.ip || null,
          }),
          signal: AbortSignal.timeout(1500),
        }).catch(() => null);
      }
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
    let payload: { username?: string; role?: Role };
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
    (req as Request & { user?: { username?: string; role?: Role } }).user = payload;

    // Token cũ từ trước khi có phân quyền (vai trò "admin"...) không còn hợp lệ
    if (!payload.role || !ALL.includes(payload.role)) {
      return sendError(
        res,
        401,
        'Unauthorized',
        'Phiên đăng nhập cũ, vui lòng đăng nhập lại',
      );
    }

    const rule = rules.find(
      (r) =>
        r.pattern.test(path) && (!r.methods || r.methods.includes(req.method)),
    );
    if (rule && !rule.roles.includes(payload.role)) {
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
