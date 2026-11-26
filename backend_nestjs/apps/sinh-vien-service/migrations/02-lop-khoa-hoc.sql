USE qldatn_sinhvien;

-- 1. Thêm cột KhoaHoc cho SinhVien
ALTER TABLE SinhVien
  ADD COLUMN KhoaHoc VARCHAR(20) NULL AFTER Email;

-- 2. Bảng Lớp hành chính để lọc Khoa -> Ngành -> Lớp (không gõ tay)
CREATE TABLE IF NOT EXISTS Lop (
    MaLop VARCHAR(50) PRIMARY KEY,
    TenLop VARCHAR(100) NOT NULL,
    KhoaHoc VARCHAR(20) NOT NULL,
    MaNganh VARCHAR(20) NOT NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT fk_lop_nganh FOREIGN KEY (MaNganh) REFERENCES Nganh(MaNganh)
) CHARACTER SET utf8mb4;

-- 3. Dữ liệu lớp mẫu (idempotent)
INSERT IGNORE INTO Khoa (MaKhoa, TenKhoa, TrangThai) VALUES
  ('CNTT', 'Công nghệ thông tin', 'HOAT_DONG');

INSERT IGNORE INTO Nganh (MaNganh, TenNganh, MaKhoa, TrangThai) VALUES
  ('KTPM', 'Kỹ thuật phần mềm', 'CNTT', 'HOAT_DONG'),
  ('HTTT', 'Hệ thống thông tin', 'CNTT', 'HOAT_DONG');

INSERT IGNORE INTO Lop (MaLop, TenLop, KhoaHoc, MaNganh, TrangThai) VALUES
  ('K46D', 'K46D - Kỹ thuật phần mềm', 'K46', 'KTPM', 'HOAT_DONG'),
  ('K46E', 'K46E - Kỹ thuật phần mềm', 'K46', 'KTPM', 'HOAT_DONG'),
  ('K47A', 'K47A - Hệ thống thông tin', 'K47', 'HTTT', 'HOAT_DONG');

-- Chuẩn hóa SV001, SV002, GV001 để test xuyên suốt
UPDATE SinhVien SET KhoaHoc = 'K46', TrangThai = 'HOAT_DONG' WHERE MaSV = 'SV001';
UPDATE SinhVien SET KhoaHoc = 'K46', MaNganh = COALESCE(MaNganh, 'KTPM'), TrangThai = 'HOAT_DONG' WHERE MaSV = 'SV002';
UPDATE GiangVien SET TrangThai = 'HOAT_DONG' WHERE MaGV = 'GV001';
