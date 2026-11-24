CREATE DATABASE IF NOT EXISTS qldatn_thongbao
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qldatn_thongbao;

CREATE TABLE IF NOT EXISTS ThongBao (
  IdThongBao   INT AUTO_INCREMENT PRIMARY KEY,
  MaNguoiNhan  VARCHAR(20) NULL,
  VaiTroNhan   VARCHAR(10) NULL,
  Loai         VARCHAR(50) NOT NULL,
  TieuDe       VARCHAR(255) NOT NULL,
  NoiDung      TEXT,
  DaDoc        TINYINT(1) NOT NULL DEFAULT 0,
  MaSuKien     VARCHAR(36) NOT NULL,
  NgayTao      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_sukien_nguoinhan (MaSuKien, MaNguoiNhan, VaiTroNhan),
  KEY idx_nguoinhan (MaNguoiNhan, DaDoc)
);

CREATE TABLE IF NOT EXISTS NhatKy (
  IdNhatKy      BIGINT AUTO_INCREMENT PRIMARY KEY,
  ThoiDiem      DATETIME NOT NULL,
  NguoiThucHien VARCHAR(50),
  VaiTro        VARCHAR(10),
  HanhDong      VARCHAR(100) NOT NULL,
  DoiTuong      VARCHAR(100),
  KetQua        VARCHAR(20),
  DiaChiIp      VARCHAR(45),
  MaSuKien      VARCHAR(36) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS LichNhac (
  IdLichNhac  INT AUTO_INCREMENT PRIMARY KEY,
  MaNguoiNhan VARCHAR(20) NOT NULL,
  Loai        VARCHAR(50) NOT NULL,
  MaDoiTuong  VARCHAR(50) NOT NULL,
  ThoiDiemGui DATETIME NOT NULL,
  MocNgay     INT NOT NULL,
  DaGui       TINYINT(1) NOT NULL DEFAULT 0,
  DaHuy       TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uq_nhac (MaNguoiNhan, Loai, MaDoiTuong, MocNgay)
);

CREATE TABLE IF NOT EXISTS SuKienDaXuLy (
  EventId  VARCHAR(36) PRIMARY KEY,
  NgayXuLy DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);