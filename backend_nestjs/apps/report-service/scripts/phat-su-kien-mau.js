/**
 * Script phát sự kiện mẫu vào CSDL qldatn_baocao của Report Service
 * Giúp kiểm thử các chức năng thống kê, tổng quan, giờ NCKH mà không cần chờ toàn bộ hệ thống phát sự kiện.
 */
let mysql;
try {
  mysql = require('mysql2');
} catch {
  mysql = require('../../../node_modules/mysql2');
}

const conn = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '123456',
  database: 'qldatn_baocao',
  multipleStatements: true,
});

conn.connect(async (err) => {
  if (err) {
    console.error('Lỗi kết nối MySQL qldatn_baocao:', err.message);
    process.exit(1);
  }

  console.log('Đã kết nối cơ sở dữ liệu qldatn_baocao. Đang nạp dữ liệu bản sao đọc mẫu...');

  const sql = `
    -- 1. Sinh viên bản sao
    INSERT INTO SinhVienBanSao (MaSV, HoTen, Lop, MaNganh, GPA, TrangThai) VALUES
    ('SV001', 'Nguyễn Văn An', 'K46D-CNTT', 'CNTT', 3.52, 'HOAT_DONG'),
    ('SV002', 'Trần Thị Bích', 'K46D-CNTT', 'CNTT', 3.80, 'HOAT_DONG'),
    ('SV003', 'Lê Hoàng Cường', 'K46E-KTPM', 'KTPM', 2.95, 'HOAT_DONG'),
    ('SV004', 'Phạm Minh Đức', 'K46E-KTPM', 'KTPM', 3.20, 'HOAT_DONG'),
    ('SV005', 'Vũ Thị Hạnh', 'K46A-HTTT', 'HTTT', 3.65, 'HOAT_DONG'),
    ('SV006', 'Đỗ Quốc Hùng', 'K46A-HTTT', 'HTTT', 2.70, 'HOAT_DONG'),
    ('SV007', 'Bùi Ngọc Lan', 'K46B-KHMT', 'KHMT', 3.40, 'HOAT_DONG'),
    ('SV008', 'Ngô Quang Long', 'K46B-KHMT', 'KHMT', 3.10, 'HOAT_DONG'),
    ('SV009', 'Đinh Thanh Mai', 'K46D-CNTT', 'CNTT', 3.75, 'HOAT_DONG'),
    ('SV010', 'Hoàng Văn Nam', 'K46E-KTPM', 'KTPM', 2.85, 'HOAT_DONG')
    ON DUPLICATE KEY UPDATE HoTen=VALUES(HoTen), Lop=VALUES(Lop), MaNganh=VALUES(MaNganh), GPA=VALUES(GPA), TrangThai=VALUES(TrangThai);

    -- 2. Đề tài bản sao
    INSERT INTO DeTaiBanSao (MaDeTai, TenDeTai, MaGV, MaNganh, ChiTieu, SoDaDuyet, TrangThai) VALUES
    (1, 'Nghiên cứu ứng dụng Kiến trúc Hướng dịch vụ (SOA) trong quản lý đề tài', 'GV001', 'CNTT', 3, 2, 'DANG_MO'),
    (2, 'Xây dựng hệ thống gợi ý chuyên gia hội đồng sử dụng RAG và Vector Database', 'GV001', 'CNTT', 2, 2, 'DANG_THUC_HIEN'),
    (3, 'Phát triển ứng dụng Web thời gian thực hỗ trợ theo dõi tiến độ đồ án', 'GV001', 'KTPM', 2, 0, 'DANG_MO'),
    (4, 'Ứng dụng Học sâu phát hiện bất thường trong dữ liệu mạng IoT', 'GV002', 'KHMT', 2, 1, 'DANG_MO'),
    (5, 'Giải pháp bảo mật và phân quyền phi tập trung cho hệ thống y tế', 'GV002', 'HTTT', 3, 0, 'CHO_DUYET'),
    (6, 'Phân tích cảm xúc mạng xã hội tiếng Việt bằng mô hình Transformer', 'GV002', 'CNTT', 2, 2, 'DA_NGHIEM_THU'),
    (7, 'Nghiên cứu mô hình ngôn ngữ lớn (LLM) hỗ trợ dịch thuật tự động', 'GV003', 'KHMT', 2, 2, 'DA_NGHIEM_THU'),
    (8, 'Tối ưu hóa lập lịch công việc dựa trên thuật toán di truyền', 'GV003', 'CNTT', 1, 1, 'DA_NGHIEM_THU')
    ON DUPLICATE KEY UPDATE TenDeTai=VALUES(TenDeTai), MaGV=VALUES(MaGV), MaNganh=VALUES(MaNganh), ChiTieu=VALUES(ChiTieu), SoDaDuyet=VALUES(SoDaDuyet), TrangThai=VALUES(TrangThai);

    -- 3. Đăng ký bản sao
    INSERT INTO DangKyBanSao (MaDangKy, MaSV, MaDeTai, TrangThai, NgayDangKy) VALUES
    (1, 'SV001', 1, 'DA_DUYET', NOW() - INTERVAL 10 DAY),
    (2, 'SV002', 1, 'DA_DUYET', NOW() - INTERVAL 9 DAY),
    (3, 'SV003', 2, 'DA_DUYET', NOW() - INTERVAL 15 DAY),
    (4, 'SV004', 2, 'DA_DUYET', NOW() - INTERVAL 14 DAY),
    (5, 'SV005', 4, 'DA_DUYET', NOW() - INTERVAL 5 DAY),
    (6, 'SV006', 4, 'CHO_DUYET', NOW() - INTERVAL 1 DAY),
    (7, 'SV007', 3, 'CHO_DUYET', NOW() - INTERVAL 2 DAY),
    (8, 'SV008', 3, 'BI_TU_CHOI', NOW() - INTERVAL 6 DAY),
    (9, 'SV009', 6, 'DA_DUYET', NOW() - INTERVAL 90 DAY),
    (10, 'SV010', 7, 'DA_DUYET', NOW() - INTERVAL 90 DAY)
    ON DUPLICATE KEY UPDATE TrangThai=VALUES(TrangThai);

    -- 4. Kết quả nghiệm thu bản sao (cho quy đổi giờ NCKH FR-31)
    INSERT INTO KetQuaNghiemThuBanSao (MaDeTai, MaGV, KetLuan, DiemTB, NamHoc, NgayNghiemThu) VALUES
    (6, 'GV002', 'DAT', 8.75, '2025-2026', NOW() - INTERVAL 30 DAY),
    (7, 'GV003', 'DAT', 9.20, '2025-2026', NOW() - INTERVAL 25 DAY),
    (8, 'GV003', 'DAT', 8.40, '2025-2026', NOW() - INTERVAL 20 DAY),
    (101, 'GV001', 'DAT', 9.00, '2025-2026', NOW() - INTERVAL 40 DAY),
    (102, 'GV001', 'DAT', 8.50, '2025-2026', NOW() - INTERVAL 35 DAY),
    (103, 'GV001', 'KHONG_DAT', 4.50, '2025-2026', NOW() - INTERVAL 15 DAY)
    ON DUPLICATE KEY UPDATE KetLuan=VALUES(KetLuan), DiemTB=VALUES(DiemTB), NamHoc=VALUES(NamHoc);

    -- 5. Tham gia hội đồng bản sao (cho quy đổi giờ NCKH FR-31)
    INSERT INTO ThamGiaHoiDongBanSao (MaHoiDong, MaGV, VaiTro, NgayHop, NamHoc) VALUES
    (1, 'GV001', 'CHU_TICH', NOW() - INTERVAL 30 DAY, '2025-2026'),
    (1, 'GV002', 'PHAN_BIEN', NOW() - INTERVAL 30 DAY, '2025-2026'),
    (1, 'GV003', 'THU_KY', NOW() - INTERVAL 30 DAY, '2025-2026'),
    (2, 'GV001', 'PHAN_BIEN', NOW() - INTERVAL 25 DAY, '2025-2026'),
    (2, 'GV003', 'CHU_TICH', NOW() - INTERVAL 25 DAY, '2025-2026'),
    (3, 'GV001', 'UY_VIEN', NOW() - INTERVAL 20 DAY, '2025-2026'),
    (3, 'GV002', 'CHU_TICH', NOW() - INTERVAL 20 DAY, '2025-2026')
    ON DUPLICATE KEY UPDATE VaiTro=VALUES(VaiTro), NgayHop=VALUES(NgayHop), NamHoc=VALUES(NamHoc);
  `;

  conn.query(sql, (execErr) => {
    if (execErr) {
      console.error('Lỗi khi nạp dữ liệu mẫu:', execErr);
    } else {
      console.log('>>> Nạp thành công dữ liệu bản sao đọc mẫu vào CSDL qldatn_baocao!');
    }
    conn.end();
  });
});
