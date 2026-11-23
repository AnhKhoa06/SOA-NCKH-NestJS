CREATE DATABASE IF NOT EXISTS qldatn_dangky;
USE qldatn_dangky;

CREATE TABLE DangKy (
    MaDangKy INT PRIMARY KEY AUTO_INCREMENT,
    MaSV VARCHAR(20) NOT NULL,
    MaDeTai INT NOT NULL,
    NgayDangKy DATETIME DEFAULT CURRENT_TIMESTAMP,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'CHO_DUYET',
    LyDoTuChoi VARCHAR(500) NULL,
    -- 1 khi đăng ký còn hiệu lực, NULL khi không; kết hợp UNIQUE để mỗi SV tối đa một đăng ký còn hiệu lực (BR-05)
    HieuLuc TINYINT GENERATED ALWAYS AS (CASE WHEN TrangThai IN ('CHO_DUYET', 'DA_DUYET') THEN 1 ELSE NULL END) STORED,
    UNIQUE KEY UQ_DangKy_SV_HieuLuc (MaSV, HieuLuc),
    KEY IX_DangKy_DeTai_TrangThai (MaDeTai, TrangThai)
);

-- Dòng khóa dùng khi duyệt đăng ký (B5): SELECT ... FOR UPDATE
CREATE TABLE ChiTieuDeTai (
    MaDeTai INT PRIMARY KEY,
    SoDaDuyet INT NOT NULL DEFAULT 0
);