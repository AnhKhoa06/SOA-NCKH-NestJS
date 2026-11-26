# Hướng dẫn viết trang (frontend_react)

Khung giao diện (sidebar, topbar, menu theo vai trò, định tuyến) đã làm sẵn.
Mỗi người chỉ mở file trang của mình trong `src/pages/`, xóa dòng `<ComingSoon .../>` và viết giao diện thật.

KHÔNG sửa: `api.js`, `components/`, `config/`, `App.jsx`, `App.css`. Cần thêm gì thì nhắn Khoa.
Muốn thêm một trang mới (ngoài các trang có sẵn): nhắn Khoa thêm vào `config/menu.js` và `config/routes.jsx`.

## Trang nào của ai

| Trang                                | File                                                     | Người làm                                        |
| ------------------------------------ | -------------------------------------------------------- | ------------------------------------------------ |
| Tổng quan                            | `TongQuan.jsx`                                           | Huy                                              |
| Khoa, Ngành, Giảng viên              | `Khoa.jsx`, `Nganh.jsx`, `GiangVien.jsx`                 | Khương                                           |
| Sinh viên                            | `SinhVien.jsx`                                           | Khương                                           |
| Đợt đề tài                           | `DotDeTai.jsx`                                           | Khang                                            |
| Đề tài                               | `DeTai.jsx`                                              | Khang                                            |
| Đăng ký                              | `DangKy.jsx`                                             | Khoa                                             |
| Hội đồng nghiệm thu                  | `HoiDong.jsx`                                            | Khương                                           |
| Thống kê đề tài, sinh viên, Giờ NCKH | `ThongKeDeTai.jsx`, `ThongKeSinhVien.jsx`, `GioNckh.jsx` | Huy                                              |
| Thông báo, Nhật ký                   | `ThongBao.jsx`, `NhatKy.jsx`                             | Lịch                                             |
| Tài khoản                            | `TaiKhoan.jsx`                                           | Khoa (đã xong, dùng làm mẫu)                     |
| Hồ sơ cá nhân                        | `HoSoCaNhan.jsx` (+ `HoSoCaNhan.css`)                    | Khoa (đã xong); Khương bổ sung họ tên, khoa, lớp |
| Đổi mật khẩu                         | `DoiMatKhau.jsx` (+ `DoiMatKhau.css`)                    | Khoa (đã xong)                                   |

## Vai trò và đăng nhập

- Ba vai trò: `QTV`, `GV`, `SV`. Đăng nhập bằng **Mã đăng nhập** (không phân biệt hoa/thường): `admin` / `QTV001` (QTV), `GV001` (GV), `SV001` / `SV002` (SV). Mật khẩu `GV001`, `SV001`, `SV002`: `Test@12345`. Mật khẩu `admin` theo `ADMIN_PASS` trong `backend_nestjs/.env` (mặc định `admin123` nếu không đặt).
- Lấy thông tin người đang đăng nhập: `auth.getUser()` (từ `api.js`) trả `{ username, role, maDinhDanh }`.
- Một trang có thể được nhiều vai trò vào (ví dụ Đề tài). Hãy ẩn hoặc hiện nút theo `auth.getUser().role`, nhưng backend mới là nơi kiểm tra quyền thật.

## Công cụ dùng chung

- `api` (src/api.js): api.get / post / put / patch / delete. Lỗi ném ra Error có `.message` tiếng Việt và `.status`.
- `useToast()` (components/Toast): toast.success(msg), toast.error(msg)
- `Modal` (components/Modal): props open, title, onClose, children, footer
- `ConfirmDialog` (components/ConfirmDialog): props open, message, loading, onConfirm, onCancel
- Mẫu bảng và popup: `pages/TaiKhoan.jsx`.
- Mẫu trang dạng thẻ thông tin hoặc biểu mẫu: `pages/HoSoCaNhan.jsx` và `pages/DoiMatKhau.jsx`

## Quy ước giao diện

- Tiêu đề trang: `<div className="page-header"><h2>...</h2><button>Thêm</button></div>`
- Bảng bọc trong `<div className="card">`; cột thao tác dùng `<div className="table-actions">` với nút `btn-edit` và `btn-delete`
- Form trong popup dùng `.form-group` (label + input)
- Lỗi và thành công hiện bằng toast, không dùng alert
- Có trạng thái đang tải và trạng thái bảng trống (`.loading-state`, `.empty-state`)
- Xóa phải qua ConfirmDialog
- Danh sách phân trang: backend trả `{ data, page, size, total, totalPages }`
- CSS riêng cho trang: tạo file `TenTrang.css` cạnh trang, đặt tiền tố riêng cho class (ví dụ `hs-`, `mk-`), không sửa `App.css`. Nếu nút trong trang bị `App.css` đè kiểu (nền xanh, padding lớn), viết selector có tiền tố `.content` phía trước và dùng `!important` cho thuộc tính bị đè (xem `.mk-eye` trong `DoiMatKhau.css`).

## Quy ước dữ liệu

- JSON dùng camelCase; trạng thái là mã viết hoa không dấu (`CHO_DUYET`, `DANG_MO`...), giao diện tự đổi sang tiếng Việt.
- Đường dẫn API đầy đủ và mã lỗi: xem `phancong.md` mục 3 và mục của mình.

## Hai lỗi hay gặp khi viết trang

**1. Trang tải lại liên tục rồi báo 429 "Quá nhiều yêu cầu".**
Nguyên nhân thường gặp: đặt object hoặc hàm tạo mới mỗi lần render vào mảng phụ thuộc của `useEffect` hoặc `useCallback`, và trang đó có toast lỗi. `toast` từ `useToast()` đã được giữ ổn định nên dùng trong mảng phụ thuộc được. Gateway chỉ cho 100 yêu cầu mỗi phút mỗi IP, vòng lặp sẽ chạm giới hạn rất nhanh. Cách kiểm tra: mở DevTools, thấy cùng một yêu cầu lặp lại là đang có vòng lặp.

**2. Sinh viên, giảng viên bị 403 "Không đủ quyền truy cập".**
Mỗi vai trò chỉ gọi được một số API (bảng luật ở đầu `backend_nestjs/apps/api-gateway/src/main.ts`). Trang dùng chung cho nhiều vai trò phải gọi API theo vai trò: ví dụ SV không gọi được `GET /tai-khoan` hay `POST /de-tai`, nên mã sinh viên lấy từ `auth.getUser().maDinhDanh` thay vì tra cả danh sách. Cần mở thêm quyền thì nhắn Khoa, đừng tự sửa Gateway.

## Mã lỗi HTTP có thể gặp

400 (thiếu hoặc sai dữ liệu), 401 (hết phiên), 403 (không đủ quyền), 404 (không tồn tại), 409 (trùng, hoặc xung đột), 422 (không đạt điều kiện nghiệp vụ), 429 (quá nhiều yêu cầu), 503 (dịch vụ phía sau không phản hồi)
