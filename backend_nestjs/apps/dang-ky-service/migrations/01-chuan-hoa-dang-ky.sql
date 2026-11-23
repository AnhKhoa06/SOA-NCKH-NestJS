USE qldatn_dangky;

-- 1. Đổi trạng thái cũ sang mã mới (trước khi thêm cột sinh)
UPDATE DangKy
SET TrangThai = CASE TrangThai
    WHEN 'Cho duyet' THEN 'CHO_DUYET'
    WHEN 'Da duyet'  THEN 'DA_DUYET'
    WHEN 'Tu choi'   THEN 'BI_TU_CHOI'
    ELSE TrangThai
END
WHERE MaDangKy > 0;

-- 2. Thêm cột lý do từ chối và cột HieuLuc (tự tính từ TrangThai)
ALTER TABLE DangKy
    MODIFY TrangThai VARCHAR(20) NOT NULL DEFAULT 'CHO_DUYET',
    ADD COLUMN LyDoTuChoi VARCHAR(500) NULL AFTER TrangThai,
    ADD COLUMN HieuLuc TINYINT
        GENERATED ALWAYS AS (CASE WHEN TrangThai IN ('CHO_DUYET', 'DA_DUYET') THEN 1 ELSE NULL END) STORED
        AFTER LyDoTuChoi;

-- 3. Ràng buộc duy nhất (BR-05) và chỉ mục đếm theo đề tài
ALTER TABLE DangKy
    ADD UNIQUE KEY UQ_DangKy_SV_HieuLuc (MaSV, HieuLuc),
    ADD KEY IX_DangKy_DeTai_TrangThai (MaDeTai, TrangThai);

-- 4. Bảng chỉ tiêu: dòng khóa dùng khi duyệt (B5)
CREATE TABLE IF NOT EXISTS ChiTieuDeTai (
    MaDeTai INT PRIMARY KEY,
    SoDaDuyet INT NOT NULL DEFAULT 0
);

INSERT INTO ChiTieuDeTai (MaDeTai, SoDaDuyet)
SELECT MaDeTai, COUNT(*) FROM DangKy WHERE TrangThai = 'DA_DUYET' GROUP BY MaDeTai
ON DUPLICATE KEY UPDATE SoDaDuyet = VALUES(SoDaDuyet);