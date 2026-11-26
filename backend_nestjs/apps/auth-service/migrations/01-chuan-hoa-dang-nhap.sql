USE qldatn_auth;

-- 1. Thêm Email và BatBuocDoiMatKhau vào TaiKhoan
ALTER TABLE TaiKhoan
  ADD COLUMN Email VARCHAR(255) NULL UNIQUE AFTER MaDinhDanh,
  ADD COLUMN BatBuocDoiMatKhau BOOLEAN NOT NULL DEFAULT FALSE AFTER TrangThai;

-- 2. Chuẩn hóa tài khoản dev cũ sang đăng nhập bằng mã (giữ admin hoạt động)
UPDATE TaiKhoan
SET TenDangNhap = 'SV001', MaDinhDanh = 'SV001', Email = COALESCE(Email, 'sv001@example.com')
WHERE LOWER(TenDangNhap) = 'sv01';

UPDATE TaiKhoan
SET TenDangNhap = 'GV001', MaDinhDanh = 'GV001', Email = COALESCE(Email, 'gv001@example.com')
WHERE LOWER(TenDangNhap) = 'gv01';

UPDATE TaiKhoan
SET TenDangNhap = 'SV002', MaDinhDanh = 'SV002', Email = COALESCE(Email, 'sv002@example.com')
WHERE LOWER(TenDangNhap) = 'sv02';

UPDATE TaiKhoan
SET TenDangNhap = 'GV002', MaDinhDanh = 'GV002', Email = COALESCE(Email, 'gv002@example.com')
WHERE LOWER(TenDangNhap) = 'gv02';

-- 3. Thu hồi toàn bộ refresh token cũ để các phiên cũ đăng nhập lại theo mã mới
UPDATE RefreshToken SET DaThuHoi = TRUE WHERE DaThuHoi = FALSE;
