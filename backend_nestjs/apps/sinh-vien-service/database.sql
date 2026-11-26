CREATE DATABASE IF NOT EXISTS qldatn_sinhvien CHARACTER SET utf8mb4;
USE qldatn_sinhvien;

CREATE TABLE Khoa (
    MaKhoa VARCHAR(20) PRIMARY KEY,
    TenKhoa VARCHAR(255) NOT NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG'
) CHARACTER SET utf8mb4;

CREATE TABLE Nganh (
    MaNganh VARCHAR(20) PRIMARY KEY,
    TenNganh VARCHAR(255) NOT NULL,
    MaKhoa VARCHAR(20) NOT NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT fk_nganh_khoa FOREIGN KEY (MaKhoa) REFERENCES Khoa(MaKhoa)
) CHARACTER SET utf8mb4;

CREATE TABLE Lop (
    MaLop VARCHAR(50) PRIMARY KEY,
    TenLop VARCHAR(100) NOT NULL,
    KhoaHoc VARCHAR(20) NOT NULL,
    MaNganh VARCHAR(20) NOT NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT fk_lop_nganh FOREIGN KEY (MaNganh) REFERENCES Nganh(MaNganh)
) CHARACTER SET utf8mb4;

CREATE TABLE GiangVien (
    MaGV VARCHAR(20) PRIMARY KEY,
    HoTen VARCHAR(255) NOT NULL,
    Email VARCHAR(255),
    MaKhoa VARCHAR(20) NOT NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT fk_gv_khoa FOREIGN KEY (MaKhoa) REFERENCES Khoa(MaKhoa)
) CHARACTER SET utf8mb4;

CREATE TABLE SinhVien (
    MaSV VARCHAR(20) PRIMARY KEY,
    HoTen VARCHAR(255) NOT NULL,
    Email VARCHAR(255),
    KhoaHoc VARCHAR(20) NULL,
    Lop VARCHAR(50),
    MaNganh VARCHAR(20) NULL,
    GPA DECIMAL(3,2) NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT fk_sv_nganh FOREIGN KEY (MaNganh) REFERENCES Nganh(MaNganh),
    CONSTRAINT chk_sv_gpa CHECK (GPA IS NULL OR (GPA >= 0 AND GPA <= 4.0))
) CHARACTER SET utf8mb4;

-- Dữ liệu mẫu (khớp tài khoản thử QTV001, GV001, SV001, SV002)
INSERT INTO Khoa (MaKhoa, TenKhoa) VALUES ('CNTT', 'Công nghệ thông tin');
INSERT INTO Nganh (MaNganh, TenNganh, MaKhoa) VALUES
  ('KTPM', 'Kỹ thuật phần mềm', 'CNTT'),
  ('HTTT', 'Hệ thống thông tin', 'CNTT');
INSERT INTO Lop (MaLop, TenLop, KhoaHoc, MaNganh) VALUES
  ('K46D', 'K46D - Kỹ thuật phần mềm', 'K46', 'KTPM'),
  ('K46E', 'K46E - Kỹ thuật phần mềm', 'K46', 'KTPM'),
  ('K47A', 'K47A - Hệ thống thông tin', 'K47', 'HTTT');
INSERT INTO GiangVien (MaGV, HoTen, Email, MaKhoa) VALUES
  ('GV001', 'Giảng viên Thử', 'gv001@example.com', 'CNTT');
INSERT INTO SinhVien (MaSV, HoTen, Email, KhoaHoc, Lop, MaNganh, GPA) VALUES
  ('SV001', 'Sinh viên Thử 1', 'sv001@example.com', 'K46', 'K46D', 'KTPM', 3.20),
  ('SV002', 'Sinh viên Thử 2', 'sv002@example.com', 'K46', 'K46E', 'KTPM', 3.40);
