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
    Lop VARCHAR(50),
    MaNganh VARCHAR(20) NULL,
    GPA DECIMAL(3,2) NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT fk_sv_nganh FOREIGN KEY (MaNganh) REFERENCES Nganh(MaNganh),
    CONSTRAINT chk_sv_gpa CHECK (GPA IS NULL OR (GPA >= 0 AND GPA <= 4.0))
) CHARACTER SET utf8mb4;

-- Dữ liệu mẫu (khớp tài khoản thử gv01/GV001, sv01/SV001)
INSERT INTO Khoa (MaKhoa, TenKhoa) VALUES ('CNTT', 'Công nghệ thông tin');
INSERT INTO Nganh (MaNganh, TenNganh, MaKhoa) VALUES ('KTPM', 'Kỹ thuật phần mềm', 'CNTT');
INSERT INTO GiangVien (MaGV, HoTen, Email, MaKhoa) VALUES ('GV001', 'Giảng viên Thử', 'gv001@example.com', 'CNTT');
INSERT INTO SinhVien (MaSV, HoTen, Email, Lop, MaNganh, GPA)
VALUES ('SV001', 'Sinh viên Thử', 'sv001@example.com', 'K46D', 'KTPM', 3.20);