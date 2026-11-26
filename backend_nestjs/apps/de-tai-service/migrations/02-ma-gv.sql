USE qldatn_detai;

-- 1. Thêm cột MaGV liên kết chuẩn với Academic (GiangVien.MaGV)
ALTER TABLE DeTai
  ADD COLUMN MaGV VARCHAR(20) NULL AFTER GiangVienHuongDan,
  ADD KEY IX_DeTai_MaGV (MaGV);

-- 2. Chuẩn hóa dữ liệu cũ theo tên giảng viên hiện có trong Academic
-- (Các đề tài có tên giảng viên không tồn tại trong GiangVien như 'Vũ Sơn Lâm', 'Đinh Thị Mỹ Cảnh' giữ MaGV = NULL)
UPDATE DeTai
SET MaGV = 'GV002', GiangVienHuongDan = 'Võ Thị Mỹ'
WHERE MaGV IS NULL
  AND LOWER(TRIM(GiangVienHuongDan)) IN ('vo thi my', 'võ thị mỹ');

UPDATE DeTai
SET MaGV = 'GV001', GiangVienHuongDan = 'Giảng viên Thử'
WHERE MaGV IS NULL
  AND LOWER(TRIM(GiangVienHuongDan)) IN ('gv001', 'giảng viên thử');
