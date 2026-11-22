import {
  ForbiddenException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { TaiKhoan } from './tai-khoan.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    @InjectRepository(TaiKhoan) private tkRepo: Repository<TaiKhoan>,
    @InjectRepository(RefreshToken) private rtRepo: Repository<RefreshToken>,
  ) {}

  // Seed tài khoản thử nghiệm khi bảng còn trống
  async onModuleInit() {
    if ((await this.tkRepo.count()) > 0) return;
    const adminUser = this.config.get<string>('ADMIN_USER', 'admin');
    const adminPass = this.config.get<string>('ADMIN_PASS', 'admin123');
    const seedPass = this.config.get<string>('SEED_PASSWORD', 'Test@12345');
    const rows: Partial<TaiKhoan>[] = [
      {
        tenDangNhap: adminUser,
        vaiTro: 'QTV',
        maDinhDanh: null,
        pass: adminPass,
      } as any,
      {
        tenDangNhap: 'gv01',
        vaiTro: 'GV',
        maDinhDanh: 'GV001',
        pass: seedPass,
      } as any,
      {
        tenDangNhap: 'sv01',
        vaiTro: 'SV',
        maDinhDanh: 'SV001',
        pass: seedPass,
      } as any,
    ];
    for (const r of rows) {
      const { pass, ...rest } = r as any;
      await this.tkRepo.save(
        this.tkRepo.create({
          ...rest,
          matKhauBam: await bcrypt.hash(pass, 10),
        }),
      );
    }
  }

  // Refresh token dài > 72 ký tự nên băm bằng SHA-256 (bcrypt chỉ dùng 72 byte đầu)
  private sha(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(tk: TaiKhoan) {
    const payload = {
      sub: String(tk.id),
      username: tk.tenDangNhap,
      role: tk.vaiTro,
      maDinhDanh: tk.maDinhDanh ?? undefined,
    };
    const access_token = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m') as any,
    });
    const refresh_token = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d') as any,
      jwtid: randomUUID(), // mỗi token là duy nhất
    });
    const { exp } = this.jwt.decode(refresh_token) as { exp: number };
    await this.rtRepo.save(
      this.rtRepo.create({
        idTaiKhoan: tk.id,
        tokenBam: this.sha(refresh_token),
        hetHan: new Date(exp * 1000),
        daThuHoi: false,
      }),
    );
    return {
      access_token,
      refresh_token,
      user: {
        username: tk.tenDangNhap,
        role: tk.vaiTro,
        maDinhDanh: tk.maDinhDanh,
      },
    };
  }

  async login(username: string, password: string) {
    const maxFails = Number(this.config.get('LOGIN_MAX_FAILS', 5));
    const lockMin = Number(this.config.get('LOGIN_LOCK_MINUTES', 15));
    const sai = new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu');

    const tk = await this.tkRepo.findOne({ where: { tenDangNhap: username } });
    if (!tk) throw sai;

    if (tk.khoaDen && tk.khoaDen > new Date()) {
      throw new ForbiddenException(
        'Tài khoản tạm khóa do đăng nhập sai nhiều lần, hãy thử lại sau',
      );
    }

    const ok = await bcrypt.compare(password, tk.matKhauBam);
    if (!ok) {
      tk.soLanSai += 1;
      if (tk.soLanSai >= maxFails) {
        tk.khoaDen = new Date(Date.now() + lockMin * 60_000);
        tk.soLanSai = 0;
      }
      await this.tkRepo.save(tk);
      throw sai;
    }

    if (tk.trangThai !== 'HOAT_DONG') {
      throw new ForbiddenException('Tài khoản đã bị khóa hoặc ngừng hoạt động');
    }

    tk.soLanSai = 0;
    tk.khoaDen = null;
    await this.tkRepo.save(tk);
    return this.issueTokens(tk);
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
    const row = await this.rtRepo.findOne({
      where: { tokenBam: this.sha(refreshToken) },
    });
    if (!row || row.daThuHoi || row.hetHan < new Date()) {
      throw new UnauthorizedException(
        'Refresh token đã bị thu hồi, hãy đăng nhập lại',
      );
    }
    const tk = await this.tkRepo.findOne({
      where: { id: Number(payload.sub) },
    });
    if (!tk || tk.trangThai !== 'HOAT_DONG') {
      throw new UnauthorizedException('Tài khoản không còn hoạt động');
    }
    row.daThuHoi = true; // xoay vòng: token cũ vô hiệu ngay
    await this.rtRepo.save(row);
    return this.issueTokens(tk);
  }

  async logout(idTaiKhoan: number) {
    await this.rtRepo.update(
      { idTaiKhoan, daThuHoi: false },
      { daThuHoi: true },
    );
    return { message: 'Đã đăng xuất' };
  }
}
