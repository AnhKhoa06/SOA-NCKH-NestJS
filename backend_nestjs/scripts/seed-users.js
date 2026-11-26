const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadEnv(path.join(__dirname, '..', '.env'));
loadEnv(path.join(__dirname, '..', 'apps', 'auth-service', '.env'));

function parseCsv(filePath) {
  const lines = fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] || '';
    });
    return obj;
  });
}

function randomPassword() {
  return crypto.randomBytes(6).toString('base64url') + '@1';
}

async function main() {
  const fileArg = process.argv.find((a) => a.startsWith('--file='));
  const csvPath = fileArg
    ? path.resolve(fileArg.slice('--file='.length))
    : path.join(__dirname, '..', 'seeds', 'users.sample.csv');

  const rule = process.env.SEED_PASSWORD_RULE || 'default'; // 'default' | 'code' | 'random'
  const defaultPass = process.env.SEED_PASSWORD || 'Test@12345';
  const rows = parseCsv(csvPath);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
  });

  let createdAcademic = 0;
  let createdAuth = 0;
  let skipped = 0;
  const generatedCreds = [];

  try {
    for (const r of rows) {
      const ma = (r.maDinhDanh || '').trim().toUpperCase();
      const role = (r.role || 'SV').trim().toUpperCase();
      if (!ma || !['SV', 'GV'].includes(role)) continue;

      if (role === 'GV') {
        const [exGv] = await conn.query(
          'SELECT MaGV FROM qldatn_sinhvien.GiangVien WHERE MaGV = ?',
          [ma],
        );
        if (exGv.length === 0) {
          await conn.query(
            'INSERT INTO qldatn_sinhvien.GiangVien (MaGV, HoTen, Email, MaKhoa, TrangThai) VALUES (?, ?, ?, ?, ?)',
            [ma, r.hoTen || ma, r.email || null, r.maKhoa || 'CNTT', 'HOAT_DONG'],
          );
          createdAcademic++;
        }
      } else {
        const [exSv] = await conn.query(
          'SELECT MaSV FROM qldatn_sinhvien.SinhVien WHERE MaSV = ?',
          [ma],
        );
        if (exSv.length === 0) {
          await conn.query(
            'INSERT INTO qldatn_sinhvien.SinhVien (MaSV, HoTen, Email, KhoaHoc, Lop, MaNganh, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              ma,
              r.hoTen || ma,
              r.email || null,
              r.khoaHoc || null,
              r.lop || null,
              r.maNganh || null,
              'HOAT_DONG',
            ],
          );
          createdAcademic++;
        }
      }

      const [exTk] = await conn.query(
        'SELECT IdTaiKhoan FROM qldatn_auth.TaiKhoan WHERE LOWER(TenDangNhap) = LOWER(?) OR LOWER(MaDinhDanh) = LOWER(?)',
        [ma, ma],
      );
      if (exTk.length === 0) {
        const rawPass = r.matKhau
          ? r.matKhau.trim()
          : rule === 'code'
            ? `${ma}@123`
            : rule === 'random'
              ? randomPassword()
              : defaultPass;
        const hash = await bcrypt.hash(rawPass, 10);
        await conn.query(
          'INSERT INTO qldatn_auth.TaiKhoan (TenDangNhap, MatKhauBam, VaiTro, MaDinhDanh, Email, TrangThai, BatBuocDoiMatKhau) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [ma, hash, role, ma, r.email || null, 'HOAT_DONG', false],
        );
        createdAuth++;
        if (rule === 'random') generatedCreds.push({ ma, role, password: rawPass });
      } else {
        skipped++;
      }
    }

    if (generatedCreds.length > 0) {
      const outPath = path.join(__dirname, '..', 'seeds', 'generated-passwords.txt');
      fs.writeFileSync(
        outPath,
        generatedCreds.map((x) => `${x.ma} (${x.role}): ${x.password}`).join('\n'),
      );
      console.log(`Đã ghi mật khẩu ngẫu nhiên ra ${outPath}`);
    }

    console.log(
      `Seed hoàn tất: Academic mới=${createdAcademic}, Tài khoản mới=${createdAuth}, Đã tồn tại (bỏ qua)=${skipped}`,
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Lỗi seed:', err.message);
  process.exit(1);
});
