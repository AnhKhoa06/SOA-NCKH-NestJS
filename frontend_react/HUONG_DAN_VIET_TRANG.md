# Hướng dẫn viết trang (frontend_react)

Khung giao diện (sidebar, topbar, menu theo vai trò, định tuyến) đã làm sẵn.
Mỗi người chỉ mở file trang của mình trong `src/pages/`, xóa dòng `<ComingSoon .../>` và viết giao diện thật.

KHÔNG sửa: `api.js`, `components/`, `config/`, `App.jsx`, `App.css`. Cần thêm gì thì nhắn Khoa.
Muốn thêm một trang mới (ngoài các trang có sẵn): nhắn Khoa thêm vào `config/menu.js` và `config/routes.jsx`.

## Trang nào của ai

| Trang                                | File                                                     | Người làm                    |
| ------------------------------------ | -------------------------------------------------------- | ---------------------------- |
| Tổng quan                            | `TongQuan.jsx`                                           | Huy                          |
| Khoa, Ngành, Giảng viên              | `Khoa.jsx`, `Nganh.jsx`, `GiangVien.jsx`                 | Khương                       |
| Sinh viên                            | `SinhVien.jsx`                                           | Khương                       |
| Đợt đề tài                           | `DotDeTai.jsx`                                           | Khang                        |
| Đề tài                               | `DeTai.jsx`                                              | Khang                        |
| Đăng ký                              | `DangKy.jsx`                                             | Khoa                         |
| Hội đồng nghiệm thu                  | `HoiDong.jsx`                                            | Khương                       |
| Thống kê đề tài, sinh viên, Giờ NCKH | `ThongKeDeTai.jsx`, `ThongKeSinhVien.jsx`, `GioNckh.jsx` | Huy                          |
| Thông báo, Nhật ký                   | `ThongBao.jsx`, `NhatKy.jsx`                             | Lịch                         |
| Tài khoản, Đổi mật khẩu              | `TaiKhoan.jsx`, `DoiMatKhau.jsx`                         | Khoa (đã xong, dùng làm mẫu) |

## Vai trò và đăng nhập

- Ba vai trò: `QTV`, `GV`, `SV`. Tài khoản thử: `admin` (QTV), `gv01` (GV001), `sv01` (SV001). Mật khẩu `gv01` và `sv01`: `Test@12345`.
- Lấy thông tin người đang đăng nhập: `auth.getUser()` (từ `api.js`) trả `{ username, role, maDinhDanh }`.
- Một trang có thể được nhiều vai trò vào (ví dụ Đề tài). Hãy ẩn hoặc hiện nút theo `auth.getUser().role`, nhưng backend mới là nơi kiểm tra quyền thật.

## Công cụ dùng chung

- `api` (src/api.js): api.get / post / put / patch / delete. Lỗi ném ra Error có `.message` tiếng Việt và `.status`.
- `useToast()` (components/Toast): toast.success(msg), toast.error(msg)
- `Modal` (components/Modal): props open, title, onClose, children, footer
- `ConfirmDialog` (components/ConfirmDialog): props open, message, loading, onConfirm, onCancel
- Xem `pages/TaiKhoan.jsx` làm mẫu: bảng, phân trang, tìm kiếm, popup thêm, xác nhận khóa.

## Quy ước giao diện

- Tiêu đề trang: `<div className="page-header"><h2>...</h2><button>Thêm</button></div>`
- Bảng bọc trong `<div className="card">`; cột thao tác dùng `<div className="table-actions">` với nút `btn-edit` và `btn-delete`
- Form trong popup dùng `.form-group` (label + input)
- Lỗi và thành công hiện bằng toast, không dùng alert
- Có trạng thái đang tải và trạng thái bảng trống (`.loading-state`, `.empty-state`)
- Xóa phải qua ConfirmDialog
- Danh sách phân trang: backend trả `{ data, page, size, total, totalPages }`

## Quy ước dữ liệu

- JSON dùng camelCase; trạng thái là mã viết hoa không dấu (`CHO_DUYET`, `DANG_MO`...), giao diện tự đổi sang tiếng Việt.
- Đường dẫn API đầy đủ và mã lỗi: xem `phancong.md` mục 3 và mục của mình.

## Mã lỗi HTTP có thể gặp

400 (thiếu hoặc sai dữ liệu), 401 (hết phiên), 403 (không đủ quyền), 404 (không tồn tại), 409 (trùng, hoặc xung đột), 422 (không đạt điều kiện nghiệp vụ), 429 (quá nhiều yêu cầu), 503 (dịch vụ phía sau không phản hồi)
