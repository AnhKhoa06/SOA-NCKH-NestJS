USE qldatn_sinhvien;

-- 1. Bảng mới
CREATE TABLE IF NOT EXISTS Khoa (
    MaKhoa VARCHAR(20) PRIMARY KEY,
    TenKhoa VARCHAR(255) NOT NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG'
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS Nganh (
    MaNganh VARCHAR(20) PRIMARY KEY,
    TenNganh VARCHAR(255) NOT NULL,
    MaKhoa VARCHAR(20) NOT NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT fk_nganh_khoa FOREIGN KEY (MaKhoa) REFERENCES Khoa(MaKhoa)
) CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS GiangVien (
    MaGV VARCHAR(20) PRIMARY KEY,
    HoTen VARCHAR(255) NOT NULL,
    Email VARCHAR(255),
    MaKhoa VARCHAR(20) NOT NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    CONSTRAINT fk_gv_khoa FOREIGN KEY (MaKhoa) REFERENCES Khoa(MaKhoa)
) CHARACTER SET utf8mb4;

-- 2. Dữ liệu mẫu (khớp tài khoản thử gv01/GV001, sv01/SV001)
INSERT IGNORE INTO Khoa (MaKhoa, TenKhoa) VALUES ('CNTT', 'Công nghệ thông tin');
INSERT IGNORE INTO Nganh (MaNganh, TenNganh, MaKhoa) VALUES ('KTPM', 'Kỹ thuật phần mềm', 'CNTT');
INSERT IGNORE INTO GiangVien (MaGV, HoTen, Email, MaKhoa) VALUES ('GV001', 'Giảng viên Thử', 'gv001@example.com', 'CNTT');

-- 3. Sửa bảng SinhVien
ALTER TABLE SinhVien
    ADD COLUMN MaNganh VARCHAR(20) NULL,
    ADD COLUMN GPA DECIMAL(3,2) NULL,
    ADD COLUMN TrangThai VARCHAR(20) NOT NULL DEFAULT 'HOAT_DONG',
    ADD CONSTRAINT fk_sv_nganh FOREIGN KEY (MaNganh) REFERENCES Nganh(MaNganh),
    ADD CONSTRAINT chk_sv_gpa CHECK (GPA IS NULL OR (GPA >= 0 AND GPA <= 4.0)),
    DROP COLUMN Password,
    DROP COLUMN Token;

-- 4. Gán ngành cho sinh viên thử (nếu đã có)
UPDATE SinhVien SET MaNganh = 'KTPM', GPA = 3.20 WHERE MaSV = 'SV001';
INSERT IGNORE INTO SinhVien (MaSV, HoTen, Email, Lop, MaNganh, GPA)
VALUES ('SV001', 'Sinh viên Thử', 'sv001@example.com', 'K46D', 'KTPM', 3.20);