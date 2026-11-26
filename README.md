# SOA-NCKH — Hệ thống quản lý đề tài nghiên cứu khoa học (NestJS + React)

Đồ án môn **Kiến trúc hướng dịch vụ (SOA)** – Nhóm 5 (lớp K46D), giảng viên hướng dẫn: Võ Thị Mỹ.

Hệ thống (tên gọi **SOA-NCKH**) quản lý toàn bộ quy trình nghiên cứu khoa học của Khoa: học vụ (khoa, ngành, sinh viên, giảng viên), đề tài, đăng ký — duyệt đăng ký, thực hiện và nghiệm thu đề tài, thông báo, thống kê — báo cáo, và một dịch vụ **AI hỗ trợ** (kiểm tra đề tài trùng lặp bằng RAG, gợi ý thành viên hội đồng). Backend NestJS + MySQL, frontend React (Vite), kiến trúc SOA: mỗi dịch vụ một cổng và một cơ sở dữ liệu riêng, giao tiếp qua HTTP/REST, đi qua một API Gateway.

Tài liệu đặc tả yêu cầu phần mềm đầy đủ (SRS, chuẩn ISO/IEC/IEEE 29148): yêu cầu chức năng FR-01 → FR-33, phi chức năng NFR-01 → NFR-16, mô hình UML, phân tích kiến trúc SOA, mô hình dữ liệu, kiểm thử và ma trận truy vết — nằm trong tài liệu SRS của nhóm (`SRS_SOA-NCKH.docx`). Mã yêu cầu trong README này lấy theo tài liệu đó.

## Trạng thái hiện tại (cập nhật 26/11/2026)

Tài liệu SRS đặc tả hệ thống **đích** gồm 8 dịch vụ; bảng dưới đây cho biết phần nào đã chạy được, tránh nhầm đặc tả với tiến độ thực tế.

| Hạng mục                                                                                             | Trạng thái                                                                                  |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Tách monorepo NestJS (`apps/` + `libs/`)                                                             | Xong                                                                                        |
| Academic Service (`sinh-vien-service`), cổng 3001, CSDL `qldatn_sinhvien` (Khoa, Ngành, Lớp, GV, SV) | Xong (CRUD, lọc, phân trang, import Excel, xóa mềm, giao diện đầy đủ)                       |
| Topic Service (`de-tai-service`), cổng 3002, CSDL `qldatn_detai`                                     | Xong mức cơ bản + gán `MaGV` xác minh qua Academic, phân quyền sở hữu GV; chưa làm đợt/duyệt |
| Registration Service (`dang-ky-service`), cổng 3003, CSDL `qldatn_dangky`                            | Xong nghiệp vụ đăng ký, duyệt/từ chối, khóa chỉ tiêu, giao diện theo vai trò                |
| Auth Service (`auth-service`), cổng 3004, CSDL `qldatn_auth`                                         | Xong (đăng nhập bằng mã, tạo hồ sơ + tài khoản 1 bước, đổi MK lần đầu, đặt lại MK)          |
| Guard dùng chung (`libs/common`): JWT, `RolesGuard`, `@Roles()`, `@CurrentUser()`                    | Xong                                                                                        |
| API Gateway, cổng 3000: proxy, kiểm tra JWT và vai trò theo tuyến, CORS, giới hạn tốc độ             | Xong                                                                                        |
| Notification Service (`notification-service`), cổng 3005, CSDL `qldatn_thongbao`                     | Xong hộp thư thông báo, nhật ký hoạt động & giao diện (`ThongBao.jsx`, `NhatKy.jsx`)        |
| Report Service (`report-service`), cổng 3006, CSDL `qldatn_baocao`                                   | Xong API & 4 trang giao diện (`TongQuan`, `ThongKeDeTai`, `ThongKeSinhVien`, `GioNckh`)     |
| Hội đồng nghiệm thu (thuộc `de-tai-service/src/hoi-dong`)                                            | Đã có API lập hội đồng & kiểm tra xung đột lợi ích (B1–B3); giao diện đang chờ hoàn thiện   |
| Mở rộng Topic Service: đợt đề tài, trạng thái nhiều bước, duyệt đề tài, nộp hồ sơ                    | Chưa làm (Khang phụ trách)                                                                  |
| **AI Service (cổng 3007):** kiểm tra đề tài trùng bằng RAG, gợi ý thành viên hội đồng                | Chưa làm                                                                                    |
| Hàng đợi thông điệp (`libs/events` + RabbitMQ), sổ đăng ký dịch vụ                                   | Chưa làm                                                                                    |
| Health check, retry, circuit breaker, Docker, Swagger/OpenAPI                                        | Chưa làm                                                                                    |

## Kiến trúc đích (theo SRS) — 8 dịch vụ

```
Postman / Frontend
   │  HTTP/REST (JSON, Bearer JWT)
   ▼
API Gateway                 :3000 ── điểm vào chung: định tuyến, xác thực tập trung, ghi log
   ├──► auth-service            :3004 ── CSDL qldatn_auth (dự kiến)
   ├──► academic-service        :3001 ── CSDL qldatn_sinhvien (khoa, ngành, sinh viên, giảng viên)
   ├──► topic-service           :3002 ── CSDL qldatn_detai (đề tài, đợt, hồ sơ, hội đồng, nghiệm thu)
   ├──► registration-service    :3003 ── CSDL qldatn_dangky (đăng ký, chỉ tiêu)
   ├──► notification-service    :3005 ── CSDL qldatn_thongbao (dự kiến) — thông báo, nhật ký, nhắc hạn
   ├──► report-service          :3006 ── CSDL qldatn_baocao (dự kiến) — thống kê, báo cáo (bản sao đọc)
   └──► ai-service              :3007 ── CSDL qldatn_ai (dự kiến) + kho vector — kiểm tra trùng (RAG), gợi ý hội đồng
              │  HTTP, chuyển tiếp header Authorization
              ├──► registration → academic  (xác nhận sinh viên)
              ├──► registration → topic     (xác nhận đề tài, chỉ tiêu)
              ├──► topic → academic         (xác nhận ngành, giảng viên)
              └──► ai-service → topic, academic (đọc đề tài, giảng viên để gợi ý/so khớp)
```

Nguyên tắc đang áp dụng (chi tiết ở Chương 7 của SRS):

- Mỗi dịch vụ là một tiến trình riêng: `main.ts`, `.env`, cổng và CSDL riêng. Không khóa ngoại giữa các CSDL.
- Dịch vụ không đọc CSDL của dịch vụ khác, chỉ gọi qua API; Registration không sao chép dữ liệu sinh viên/đề tài mà luôn hỏi lại Academic/Topic (NFR-04).
- - `libs/common` chỉ chứa mã hạ tầng dùng chung (guard JWT, `RolesGuard`, decorator `@Public()`, `@Roles()`, `@CurrentUser()`), không chứa entity hay nghiệp vụ.
- AI Service chỉ **gợi ý**, không tự quyết định thay con người (BR-22): kiểm tra trùng và gợi ý hội đồng đều cần người duyệt lại.

## Các dịch vụ (tên hiện tại trong mã nguồn → tên đích theo SRS)

| Tên trong mã nguồn hiện tại | Tên đích (SRS)       | Cổng | CSDL                               | Phụ trách          |
| --------------------------- | -------------------- | ---- | ---------------------------------- | ------------------ |
| `apps/api-gateway`          | API Gateway          | 3000 | không có                           | Nhóm               |
| `apps/sinh-vien-service`    | Academic Service     | 3001 | `qldatn_sinhvien`                  | Khương             |
| `apps/de-tai-service`       | Topic Service        | 3002 | `qldatn_detai`                     | Khang              |
| `apps/dang-ky-service`      | Registration Service | 3003 | `qldatn_dangky`                    | Khoa (nhóm trưởng) |
| `apps/auth-service`         | Auth Service         | 3004 | `qldatn_auth`                      | Nhóm               |
| `apps/notification-service` | Notification Service | 3005 | `qldatn_thongbao`                  | Lịch               |
| `apps/report-service`       | Report Service       | 3006 | `qldatn_baocao`                    | Huy                |
| _(chưa tạo)_                | AI Service           | 3007 | `qldatn_ai` (dự kiến) + kho vector | Khoa (nhóm trưởng) |

Lưu ý tên database vẫn giữ tiền tố `qldatn_` (viết tắt cũ của "quản lý đồ án tốt nghiệp") dù đề tài đã đổi tên — việc đổi tiền tố database là tùy chọn, không bắt buộc, nhóm có thể giữ nguyên để đỡ phải sửa lại mọi cấu hình `.env`, `database.sql` đã có.

## Cấu trúc dự án

```
SOA-NCKH-NestJS/
├── backend_nestjs/
│   ├── apps/
│   │   ├── api-gateway/
│   │   ├── auth-service/
│   │   ├── sinh-vien-service/       # → Academic Service
│   │   ├── de-tai-service/          # → Topic Service
│   │   ├── dang-ky-service/         # → Registration Service
│   │   ├── notification-service/    # (sẽ tạo)
│   │   ├── report-service/          # (sẽ tạo)
│   │   └── ai-service/              # (sẽ tạo, Python + FastAPI, không phải NestJS)
│   ├── libs/common/
│   ├── .env.example
│   ├── nest-cli.json
│   └── tsconfig.json
├── frontend_react/
├── docs/
│   └── SRS_SOA-NCKH.docx            # Tài liệu đặc tả yêu cầu phần mềm đầy đủ
└── phancong.md                      # Phân công công việc và hướng dẫn cho từng thành viên
```

## Đối chiếu 7 tính chất SOA (mức hiện tại, xem Chương 7.11 của SRS để biết mức đích)

| Tính chất                            | Mức hiện tại             | Ghi chú                                                                                |
| ------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------- |
| 1. Liên kết lỏng (NFR-01)            | Đáp ứng (chưa container) | Cổng, CSDL riêng; chưa Docker.                                                         |
| 2. Sử dụng lại dịch vụ (NFR-04)      | Đáp ứng một phần         | Registration dùng lại API Academic và Topic.                                           |
| 3. Bất đồng bộ (NFR-05)              | Chưa                     | Chưa có hàng đợi thông điệp.                                                           |
| 4. Quản lý chính sách (NFR-06)       | Đáp ứng một phần         | Có Gateway làm điểm vào chung; mỗi dịch vụ vẫn tự kiểm tra JWT.                        |
| 5. Khả năng cộng tác (NFR-03)        | Đáp ứng một phần         | REST/JSON; chưa có OpenAPI/Swagger.                                                    |
| 6. Dò tìm và ràng buộc động (NFR-07) | Chưa                     | Địa chỉ dịch vụ ghi tĩnh trong `.env`.                                                 |
| 7. Tự phục hồi (NFR-08)              | Đáp ứng một phần         | Trả 503 khi dịch vụ phụ thuộc không phản hồi; chưa health check/retry/circuit breaker. |

## Yêu cầu môi trường

- Node.js (bản LTS) và npm
- MySQL Server và MySQL Workbench
- Git

## Hướng dẫn chạy (sau khi clone)

1. **Clone và cài thư viện:**

```
git clone https://github.com/AnhKhoa06/SOA-NCKH-NestJS.git
cd SOA-NCKH-NestJS/backend_nestjs
npm install

cd ../frontend_react
npm install
```

2. **Tạo bốn CSDL hiện có:** mở MySQL Workbench, chạy lần lượt:
   - `backend_nestjs/apps/auth-service/database.sql`
   - `backend_nestjs/apps/sinh-vien-service/database.sql`
   - `backend_nestjs/apps/de-tai-service/database.sql`
   - `backend_nestjs/apps/dang-ky-service/database.sql`

3. **Tạo file cấu hình** (không commit `.env`):
   - `backend_nestjs/.env` từ `.env.example` (DB_PASS, ADMIN_USER, ADMIN_PASS, hai JWT secret).
   - `apps/<dịch-vụ>/.env` từ `.env.example` tương ứng (ở `api-gateway` có thêm `CORS_ORIGIN`, mặc định `http://localhost:5173`).
   - Riêng `apps/auth-service/.env` phải có `DB_NAME=qldatn_auth` (Auth dùng CSDL riêng, không dùng tên CSDL trong `.env` chung).

4. **Chạy các dịch vụ hiện có**, mỗi dịch vụ một terminal, trong `backend_nestjs`:

```
npx nest start auth-service
npx nest start sinh-vien-service
npx nest start de-tai-service
npx nest start dang-ky-service
npx nest start api-gateway
```

5. **Lấy token:** `POST http://localhost:3000/auth/login` với `{ "username", "password" }`, gửi kèm `Authorization: Bearer <access_token>` cho các request sau — gọi qua cổng **3000** (Gateway).

   Lần chạy đầu, Auth Service tự tạo các tài khoản thử trong bảng `TaiKhoan` (khi bảng còn trống): `admin` / `QTV001` (QTV, mật khẩu từ `ADMIN_PASS`, mặc định `admin123`), `GV001` (GV), `SV001` và `SV002` (SV). Mật khẩu các tài khoản GV/SV mẫu là `Test@12345` (đổi bằng biến `SEED_PASSWORD`). Đăng nhập bằng mã đăng nhập không phân biệt hoa/thường (`sv001` hay `SV001` đều hợp lệ).

   Để nạp hàng loạt từ file mẫu `backend_nestjs/seeds/users.sample.csv` (idempotent, chạy nhiều lần không nhân đôi):
   ```powershell
   cd backend_nestjs
   npm run seed:users
   ```

   Để chạy kiểm thử E2E xuyên dịch vụ (yêu cầu các service 3000–3004 đang chạy):
   ```powershell
   cd backend_nestjs
   npm run test:e2e:soa
   ```

## Giới hạn đã biết

- Academic chưa có khoa/ngành/giảng viên/GPA; Topic chưa có trạng thái/duyệt/hồ sơ/hội đồng/nghiệm thu.
- Chưa có Notification, Report, AI Service; chưa có hàng đợi thông điệp, sổ đăng ký dịch vụ, health check/retry/circuit breaker, Docker.
- Xem đầy đủ các vấn đề còn mở (OI-01 → OI-09) ở mục 10.2 của tài liệu SRS.

## Lộ trình (theo thứ tự đề xuất trong SRS, mục 10.3)

1. Mở rộng Academic Service (khoa, ngành, giảng viên, GPA) và Topic Service (trạng thái, duyệt đề tài, ngành/GPA yêu cầu).
2. Bổ sung duyệt đăng ký, khóa chỉ tiêu ở Registration Service.
3. Notification Service và Report Service (bản sao đọc qua sự kiện).
4. Đợt đề tài, hồ sơ, hội đồng, nghiệm thu, nhắc hạn, quy đổi giờ NCKH.
5. **AI Service:** thử mô hình embedding trên bộ đề tài mẫu, dựng kho vector, kiểm tra trùng (RAG) và gợi ý hội đồng.
6. Hàng đợi thông điệp, sổ đăng ký dịch vụ, health check/retry/circuit breaker, Docker Compose.
7. Màn hình frontend cho các chức năng mới; bổ sung Swagger/OpenAPI.

Chi tiết từng đầu việc, người phụ trách và thứ tự làm nằm trong [`phancong.md`](phancong.md).

## Quy tắc làm việc nhóm

- Mỗi người chỉ sửa dịch vụ của mình. Phần dùng chung (`libs/common`, `apps/api-gateway`, `nest-cli.json`, `tsconfig.json`, `frontend_react/src/api.js`) do nhóm trưởng sửa.
- Tên biến môi trường và cổng đặt trong `.env`, không ghi cứng trong mã.
- Mọi quyết định/thay đổi về đặc tả phải đối chiếu với tài liệu SRS (`docs/SRS_SOA-NCKH.docx`) trước khi code.
- Việc của mỗi người ghi trong `phancong.md`; làm xong đầu việc nào thì tick vào file đó trong Pull Request của mình.

## Lưu ý về Git

- Không đẩy `node_modules/` và `.env`. Chỉ commit `.env.example`.
- Làm việc trên nhánh riêng, mở Pull Request vào `main`.
- Trước khi làm việc luôn `git pull`. Gặp conflict thì dừng lại và hỏi nhóm.

```
git add <đúng file mình sửa>
git commit -m "mô tả ngắn"
git pull --rebase --autostash
git push
```
