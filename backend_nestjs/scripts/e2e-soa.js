const assert = require('assert');
const { execSync } = require('child_process');
const path = require('path');

const GATEWAY = process.env.GATEWAY_URL || 'http://localhost:3000';

async function api(p, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${GATEWAY}${p}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

async function login(username, password) {
  const r = await api('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  assert.strictEqual(r.status, 200, `Login ${username} failed: ${JSON.stringify(r.data)}`);
  return r.data;
}

async function main() {
  const suffix = Date.now().toString().slice(-4);
  const svTest1 = `SVE${suffix}1`;
  const svTest2 = `SVE${suffix}2`;
  const gvOther = `GVE${suffix}2`;

  console.log('1. Login admin, gv001 (case-insensitive), sv001 (case-insensitive)...');
  const adminAuth = await login('admin', 'admin123');
  const gv1Auth = await login('gv001', 'Test@12345');
  const sv1Auth = await login('sv001', 'Test@12345');
  assert.strictEqual(gv1Auth.user.maDinhDanh, 'GV001');
  assert.strictEqual(sv1Auth.user.maDinhDanh, 'SV001');

  console.log('2. QTV tạo hồ sơ + tài khoản 1 bước (SVE1, SVE2, GVE2)...');
  const c1 = await api('/tai-khoan', {
    method: 'POST',
    token: adminAuth.access_token,
    body: {
      vaiTro: 'SV',
      maDinhDanh: svTest1.toLowerCase(),
      hoTen: 'SV Test E2E 1',
      email: `${svTest1.toLowerCase()}@example.com`,
      khoaHoc: 'K46',
      lop: 'K46D',
      maNganh: 'KTPM',
      matKhau: 'Test@12345',
    },
  });
  assert.strictEqual(c1.status, 201, `Create SV1 failed: ${JSON.stringify(c1.data)}`);

  const c2 = await api('/tai-khoan', {
    method: 'POST',
    token: adminAuth.access_token,
    body: {
      vaiTro: 'SV',
      maDinhDanh: svTest2,
      hoTen: 'SV Test E2E 2',
      email: `${svTest2.toLowerCase()}@example.com`,
      khoaHoc: 'K46',
      lop: 'K46E',
      maNganh: 'KTPM',
      matKhau: 'Test@12345',
    },
  });
  assert.strictEqual(c2.status, 201, `Create SV2 failed: ${JSON.stringify(c2.data)}`);

  const cGv2 = await api('/tai-khoan', {
    method: 'POST',
    token: adminAuth.access_token,
    body: {
      vaiTro: 'GV',
      maDinhDanh: gvOther,
      hoTen: 'GV Khac E2E',
      email: `${gvOther.toLowerCase()}@example.com`,
      maKhoa: 'CNTT',
      matKhau: 'Test@12345',
    },
  });
  assert.strictEqual(cGv2.status, 201, `Create GV2 failed: ${JSON.stringify(cGv2.data)}`);

  console.log('3. Kiểm tra trùng mã & trùng email -> 409...');
  const dupCode = await api('/tai-khoan', {
    method: 'POST',
    token: adminAuth.access_token,
    body: {
      vaiTro: 'SV',
      maDinhDanh: svTest1,
      hoTen: 'Trung Ma',
      email: `khac_${suffix}@example.com`,
      maNganh: 'KTPM',
      matKhau: 'Test@12345',
    },
  });
  assert.strictEqual(dupCode.status, 409);

  const dupEmail = await api('/tai-khoan', {
    method: 'POST',
    token: adminAuth.access_token,
    body: {
      vaiTro: 'SV',
      maDinhDanh: `SVX${suffix}`,
      hoTen: 'Trung Email',
      email: `${svTest1.toLowerCase()}@example.com`,
      maNganh: 'KTPM',
      matKhau: 'Test@12345',
    },
  });
  assert.strictEqual(dupEmail.status, 409);

  console.log('4. Kiểm tra lần đầu đăng nhập phải đổi mật khẩu...');
  const svTest1Login1 = await login(svTest1.toLowerCase(), 'Test@12345');
  assert.strictEqual(svTest1Login1.user.batBuocDoiMatKhau, true);
  const doiMk = await api('/tai-khoan/me/mat-khau', {
    method: 'PATCH',
    token: svTest1Login1.access_token,
    body: { matKhauCu: 'Test@12345', matKhauMoi: 'NewPass@123' },
  });
  assert.strictEqual(doiMk.status, 200);
  const svTest1Login2 = await login(svTest1, 'NewPass@123');
  assert.strictEqual(svTest1Login2.user.batBuocDoiMatKhau, false);

  const svTest2Login = await login(svTest2, 'Test@12345');
  const gvOtherLogin = await login(gvOther, 'Test@12345');

  console.log('5. QTV tạo đề tài gán GV001; GV001 tạo đề tài (ép maGV = GV001)...');
  const dtQtv = await api('/de-tai', {
    method: 'POST',
    token: adminAuth.access_token,
    body: { tenDeTai: `DeTai QTV ${suffix}`, maGV: 'GV001', soLuongToiDa: 1 },
  });
  assert.strictEqual(dtQtv.status, 201);
  assert.strictEqual(dtQtv.data.maGV, 'GV001');

  const dtGv1 = await api('/de-tai', {
    method: 'POST',
    token: gv1Auth.access_token,
    body: { tenDeTai: `DeTai GV1 ${suffix}`, maGV: gvOther, soLuongToiDa: 1 },
  });
  assert.strictEqual(dtGv1.status, 201);
  assert.strictEqual(dtGv1.data.maGV, 'GV001', 'GV phải bị ép maGV từ token');

  console.log('6. GV khác sửa/xóa đề tài của GV001 -> 403...');
  const edit403 = await api(`/de-tai/${dtQtv.data.maDeTai}`, {
    method: 'PUT',
    token: gvOtherLogin.access_token,
    body: { tenDeTai: 'Hack' },
  });
  assert.strictEqual(edit403.status, 403);
  const del403 = await api(`/de-tai/${dtQtv.data.maDeTai}`, {
    method: 'DELETE',
    token: gvOtherLogin.access_token,
  });
  assert.strictEqual(del403.status, 403);

  console.log('7. SV đăng ký -> GV001 thấy, GV khác không thấy...');
  const dk1 = await api('/dang-ky', {
    method: 'POST',
    token: svTest1Login2.access_token,
    body: { maDeTai: dtQtv.data.maDeTai },
  });
  assert.strictEqual(dk1.status, 201);

  const gv1List = await api('/dang-ky', { token: gv1Auth.access_token });
  assert.strictEqual(gv1List.status, 200);
  assert.ok(
    gv1List.data.data.some((x) => x.maDangKy === dk1.data.maDangKy),
    'GV001 phải thấy đăng ký thuộc đề tài của mình',
  );

  const gvOtherList = await api('/dang-ky', { token: gvOtherLogin.access_token });
  assert.strictEqual(gvOtherList.status, 200);
  assert.ok(
    !gvOtherList.data.data.some((x) => x.maDangKy === dk1.data.maDangKy),
    'GV khác không được thấy đăng ký của GV001',
  );

  console.log('8. Từ chối thiếu lý do -> 400 THIEU_LY_DO; có lý do -> BI_TU_CHOI...');
  const rejNoReason = await api(`/dang-ky/${dk1.data.maDangKy}/tu-choi`, {
    method: 'PATCH',
    token: gv1Auth.access_token,
    body: { lyDo: '   ' },
  });
  assert.strictEqual(rejNoReason.status, 400);
  assert.strictEqual(rejNoReason.data.code, 'THIEU_LY_DO');

  const rejOk = await api(`/dang-ky/${dk1.data.maDangKy}/tu-choi`, {
    method: 'PATCH',
    token: gv1Auth.access_token,
    body: { lyDo: 'Cần bổ sung đề cương' },
  });
  assert.strictEqual(rejOk.status, 200);
  assert.strictEqual(rejOk.data.trangThai, 'BI_TU_CHOI');

  console.log('9. SV đăng ký lại -> GV001 duyệt -> SV2 đăng ký bị HET_CHI_TIEU (409)...');
  const dk2 = await api('/dang-ky', {
    method: 'POST',
    token: svTest1Login2.access_token,
    body: { maDeTai: dtQtv.data.maDeTai },
  });
  assert.strictEqual(dk2.status, 201);

  const appOk = await api(`/dang-ky/${dk2.data.maDangKy}/duyet`, {
    method: 'PATCH',
    token: gv1Auth.access_token,
  });
  assert.strictEqual(appOk.status, 200);
  assert.strictEqual(appOk.data.trangThai, 'DA_DUYET');

  const dkSv2 = await api('/dang-ky', {
    method: 'POST',
    token: svTest2Login.access_token,
    body: { maDeTai: dtQtv.data.maDeTai },
  });
  if (dkSv2.status === 409) {
    assert.strictEqual(dkSv2.data.code, 'HET_CHI_TIEU');
  } else {
    assert.strictEqual(dkSv2.status, 201);
    const appFull = await api(`/dang-ky/${dkSv2.data.maDangKy}/duyet`, {
      method: 'PATCH',
      token: gv1Auth.access_token,
    });
    assert.strictEqual(appFull.status, 409);
    assert.strictEqual(appFull.data.code, 'HET_CHI_TIEU');
  }

  console.log('10. Kiểm tra seed:users chạy 2 lần idempotent...');
  const cwd = path.resolve(__dirname, '..');
  const s1 = execSync('npm run seed:users', { cwd, encoding: 'utf8' });
  const s2 = execSync('npm run seed:users', { cwd, encoding: 'utf8' });
  console.log('Seed 1:', s1.trim().split('\n').pop());
  console.log('Seed 2:', s2.trim().split('\n').pop());
  assert.ok(s2.includes('Tài khoản mới=0'), 'Lần seed thứ 2 không được tạo thêm tài khoản trùng');

  console.log('11. Dọn dữ liệu E2E...');
  const cleanupIds = [dk1.data.maDangKy, dk2.data.maDangKy];
  if (dkSv2.data?.maDangKy) cleanupIds.push(dkSv2.data.maDangKy);
  for (const id of cleanupIds) {
    await api(`/dang-ky/${id}`, { method: 'DELETE', token: adminAuth.access_token });
  }
  await api(`/de-tai/${dtQtv.data.maDeTai}`, { method: 'DELETE', token: adminAuth.access_token });
  await api(`/de-tai/${dtGv1.data.maDeTai}`, { method: 'DELETE', token: adminAuth.access_token });

  console.log('✅ TẤT CẢ KỊCH BẢN E2E ĐỀU PASS!');
}

main().catch((err) => {
  console.error('❌ E2E THẤT BẠI:', err);
  process.exit(1);
});
