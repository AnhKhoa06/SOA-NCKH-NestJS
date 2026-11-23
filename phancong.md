# PHÂN CÔNG CÔNG VIỆC — SOA-NCKH (Nhóm 5, lớp K46D)

Tài liệu này dành cho **cả nhóm** và cho **AI trợ lý** mà mỗi bạn dùng để làm việc. Căn cứ: SRS (`docs/SRS_SOA-NCKH.docx`), các mục được trích dẫn dạng `FR-xx`, `BR-xx`, `EV-xx`, `P-xx`, "SRS 7.3"... Cập nhật: 23/11/2026.

## 0. Cách dùng file này

### Dành cho thành viên

1. Đọc mục 1 (ai làm gì), mục 2 (thứ tự làm), mục 3 (quy ước chung, **bắt buộc theo**), rồi mục riêng của mình ở mục 4.
2. Mở chat với AI, gửi kèm **file này** (nếu có thì gửi thêm SRS), rồi nhắn đúng như mẫu:

> Mình tên là **<tên của bạn>**, thành viên nhóm 5. Đây là phancong.md của nhóm. Hãy hướng dẫn mình làm lần lượt từng đầu việc trong mục của mình. Việc đầu tiên là gì?

3. Làm xong đầu việc nào thì tick `[x]` vào đầu việc đó trong Pull Request của mình.
4. Vướng ở chỗ cần quyết định chung (đổi hợp đồng API, đổi sự kiện, sửa file dùng chung) thì **nhắn Khoa**, đừng tự đổi.

### Dành cho AI trợ lý (đọc kỹ)

- Xác định người dùng là ai từ tên họ nêu, chỉ hướng dẫn **mục của người đó** ở mục 4. Không làm hộ phần của người khác.
- Hướng dẫn **từng đầu việc một**, theo thứ tự trong mục của họ. Mỗi bước phải nói rõ: sửa **file nào** (đường dẫn đầy đủ), mã cần viết, lệnh để chạy (người dùng dùng **Windows PowerShell**, thư mục `backend_nestjs`), cách kiểm tra bằng Postman hoặc `curl`, và dấu hiệu thành công.
- Trước khi sửa một file có sẵn, **yêu cầu người dùng dán nội dung file đó**. Không đoán mã nguồn.
- Tuân thủ mục 3 (quy ước chung) và danh sách file **được sửa** của người đó. Muốn sửa file ngoài danh sách (đặc biệt `libs/common`, `apps/api-gateway`, `package.json`, `nest-cli.json`, `frontend_react/src/api.js`, `frontend_react/src/App.jsx`, `frontend_react/src/config/*`, `frontend_react/src/components/*`) thì báo người dùng nhờ Khoa.
- Không bịa hợp đồng giữa các dịch vụ. Tên đường dẫn, tên trường, mã lỗi, mã trạng thái, sự kiện: lấy từ file này hoặc SRS. Nếu thiếu, nói rõ là thiếu và đề nghị hỏi Khoa.
- Mỗi đầu việc làm xong phải có: kiểm tra dữ liệu đầu vào (DTO), kiểm tra vai trò và quyền sở hữu, đúng mã lỗi trong SRS 7.5, cập nhật `database.sql` hoặc file migration (mục 3.7), và một ca kiểm thử chạy được.
- Khi viết trang giao diện, đọc kỹ mục 3.11 và `frontend_react/HUONG_DAN_VIET_TRANG.md`.
- Khi người dùng hoàn thành đầu việc, nhắc họ tick vào checklist và cho lệnh Git theo mục 3.9.

---

### Chuẩn bị máy (làm một lần sau khi kéo `main`)

1. `git checkout main` rồi `git pull`.
2. Chạy `backend_nestjs/apps/auth-service/database.sql` trong MySQL Workbench (tạo CSDL `qldatn_auth`).
3. Chạy `backend_nestjs/apps/dang-ky-service/migrations/01-chuan-hoa-dang-ky.sql` nếu máy đã có CSDL `qldatn_dangky` từ trước (máy mới chỉ cần `database.sql`).
4. Tạo `apps/auth-service/.env` từ `.env.example`, đảm bảo có `DB_NAME=qldatn_auth`. Với Gateway, thêm các biến mới trong `apps/api-gateway/.env.example` vào `.env`.
5. Chạy `npm install` trong `backend_nestjs` và trong `frontend_react`.
6. Khởi động lại Auth Service và Gateway. Lần đầu Auth tự tạo 3 tài khoản thử (mục 3.3).
7. Đăng xuất và đăng nhập lại trên giao diện (phiên cũ vai trò `admin` bị từ chối).

## 1. Tổng quan phân công

| Người                  | Dịch vụ / mảng chính                                                                                                    | Cổng                             | CSDL                                                 | Yêu cầu (FR)                                   | Khối lượng                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------- | ------------------------------------- |
| **Khoa** (nhóm trưởng) | API Gateway, `libs/common`, thư viện sự kiện; Auth; Registration; **AI Service**; tích hợp, Docker, frontend dùng chung | 3000, 3004, 3003, 3007           | `qldatn_auth`, `qldatn_dangky`, `qldatn_ai` + Chroma | FR-10→14, FR-20→22, FR-21, FR-24, FR-32, FR-33 | Nặng (giữ phần cốt lõi: AI, RAG, LLM) |
| **Khương**             | Academic Service (`apps/sinh-vien-service`) **+ module hội đồng, chấm điểm trong Topic**                                | 3001 (và 3002 cho phần hội đồng) | `qldatn_sinhvien` (và `qldatn_detai`)                | FR-01→05, FR-28, FR-29                         | Vừa, nhiều                            |
| **Khang**              | Topic Service (`apps/de-tai-service`) phần lõi: đề tài, đợt, trạng thái, hồ sơ                                          | 3002                             | `qldatn_detai`                                       | FR-06→09, FR-25→27                             | Nặng                                  |
| **Lịch**               | Notification Service (mới, `apps/notification-service`)                                                                 | 3005                             | `qldatn_thongbao`                                    | FR-15, FR-23, FR-30                            | Vừa                                   |
| **Huy**                | Report Service (mới, `apps/report-service`)                                                                             | 3006                             | `qldatn_baocao`                                      | FR-16→19, FR-31                                | Vừa                                   |

Lý do chia như vậy:

- Phần AI (embedding, RAG, LLM) và các phần nền tảng dùng chung nằm ở Khoa, đúng đề xuất.
- Topic Service lớn nhất (FR-06→09 và FR-25→29), nên tách làm hai: Khang làm lõi, Khương làm hội đồng và chấm điểm. Khương hợp với phần này vì FR-28 cần dữ liệu giảng viên và khoa của Academic Service do chính Khương làm.
- Khương chỉ được sửa trong thư mục `apps/de-tai-service/src/hoi-dong/` (mục 4.2) để không đụng mã của Khang.

**Đã xong (Khoa, 23/11/2026):** khung nền tảng Giai đoạn 0 gồm vai trò trong token và `@Roles`, Auth có CSDL và quản lý tài khoản, Gateway (tuyến, vai trò, CORS, giới hạn tốc độ, `X-Correlation-Id`), khung frontend 3 vai trò (sidebar, topbar, trang giữ chỗ, Tài khoản, Hồ sơ cá nhân, Đổi mật khẩu). Các bạn kéo `main` về là có thể làm ngay phần của mình. Còn lại của Giai đoạn 0: bộ lọc lỗi thống nhất, client HTTP dùng chung, `libs/events` (Khoa đang làm, xem mục 4.1).

---

## 2. Thứ tự làm và phụ thuộc

Ghi hạn cụ thể từng giai đoạn vào cột "Hạn" khi cả nhóm chốt lịch.

| Giai đoạn                      | Nội dung                                                                                                                                                                                                               | Ai làm                                                                  | Hạn |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --- |
| **0. Nền tảng**                | Vai trò trong token và guard phân quyền, bộ lọc lỗi thống nhất, tiện ích phân trang, thư viện sự kiện (RabbitMQ), cài chung thư viện, Gateway thêm tuyến mới và kiểm tra vai trò, Auth có CSDL và tài khoản thử nghiệm | **Khoa** (phần lớn đã xong, còn `libs/events`, bộ lọc lỗi, client HTTP) |     |
| **1. Dịch vụ lõi** (song song) | Academic mở rộng; Topic lõi; Registration duyệt đăng ký và khóa chỉ tiêu; khung Notification; khung Report; AI nghiên cứu mô hình                                                                                      | Khương, Khang, Khoa, Lịch, Huy, Khoa                                    |     |
| **2. Sự kiện**                 | Mỗi dịch vụ phát và nhận sự kiện theo mục 5; Notification tạo thông báo; Report dựng bản sao đọc                                                                                                                       | Tất cả                                                                  |     |
| **3. Nghiệm thu**              | Đợt, hồ sơ, trạng thái nhiều bước; hội đồng, chấm điểm; nhắc hạn; quy đổi giờ                                                                                                                                          | Khang, Khương, Lịch, Huy                                                |     |
| **4. AI**                      | Kiểm tra trùng (RAG), gợi ý hội đồng, nối với Topic qua sự kiện                                                                                                                                                        | Khoa                                                                    |     |
| **5. Hoàn thiện**              | Health check, thử lại, ngắt mạch; Swagger; Docker Compose; giao diện; kiểm thử toàn hệ thống                                                                                                                           | Mỗi người cho dịch vụ của mình, Khoa tích hợp                           |     |

Ai cần gì của ai trước khi làm tiếp (để không ngồi chờ):

| Người cần                      | Cần gì                                                                | Từ ai                                           | Cách khỏi bị chặn                                                 |
| ------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| Mọi người                      | Token có `role` và `maDinhDanh`, guard `@Roles(...)`                  | Khoa (**đã xong**)                              | Kéo `main` về, dùng `@Roles(...)` từ `@app/common`                |
| Khang, Khương, Khoa            | API `GET /nganh/:ma`, `GET /giang-vien/:maGV`, `GET /sinh-vien/:maSV` | Khương                                          | Khương làm hai API tra cứu này **đầu tiên** (mục 4.2)             |
| Khoa (Registration), Khoa (AI) | Dạng JSON của `GET /de-tai/:id`                                       | Khang                                           | Khang chốt và đăng dạng JSON vào nhóm **ngay ngày đầu** (mục 4.3) |
| Lịch, Huy                      | Sự kiện thật                                                          | Khoa (thư viện), các dịch vụ phát               | Tự viết script phát sự kiện giả để thử (mục 4.4, 4.5)             |
| Khoa (AI)                      | Bộ đề tài mẫu 50 đến 100 đề tài                                       | Khoa tự soạn, Khang cho xin dữ liệu thật nếu có | Dùng dữ liệu mẫu tự tạo                                           |

---

## 3. Quy ước chung (bắt buộc)

### 3.1 Đặt tên và dữ liệu

- JSON dùng **camelCase** (chuẩn hóa theo OI-01). Cột trong MySQL giữ kiểu PascalCase như đang có (`MaSV`, `TenDeTai`...).
- Đường dẫn dùng danh từ số ít, không dấu, gạch ngang: `/de-tai`, `/dot-de-tai`, `/dang-ky`, `/giang-vien`. Hành động đặc biệt dùng `PATCH` kèm hậu tố: `/dang-ky/:id/duyet`.
- Giá trị trạng thái lưu và trả về dạng **mã không dấu viết hoa**; giao diện tự đổi sang tiếng Việt.
  - Đề tài: `CHO_DUYET`, `DANG_MO`, `DA_DONG`, `DANG_THUC_HIEN`, `CHO_NGHIEM_THU`, `DA_NGHIEM_THU`, `DA_HUY`, `BI_TU_CHOI`.
  - Đăng ký: `CHO_DUYET`, `DA_DUYET`, `BI_TU_CHOI`, `DA_HUY`.
  - Đợt: `SAP_MO`, `DANG_MO`, `DA_DONG`.
  - Bản ghi học vụ: `HOAT_DONG`, `NGUNG_HOAT_DONG` (xóa mềm, BR-09).
  - Tài khoản (Auth): `HOAT_DONG`, `KHOA_TAM`, `NGUNG_HOAT_DONG`.
  - Mức trùng: `CHUA_KIEM_TRA`, `THAP`, `TRUNG_BINH`, `CAO`.
- Vai trò: `QTV`, `GV`, `SV` (**đã áp dụng**: token mang đúng ba giá trị này; token cũ có vai trò `admin` bị Gateway từ chối 401, người dùng phải đăng nhập lại).
- Thời gian: chuỗi ISO 8601, múi giờ UTC.
- Xóa mềm cho sinh viên, giảng viên, ngành, khoa, đề tài (BR-09).

### 3.2 Phân trang, lỗi

- Danh sách: tham số `page` (từ 1) và `size` (mặc định 20, tối đa 100). Trả `{ data, page, size, total, totalPages }`.
- Lỗi luôn có dạng: `{ "statusCode", "code", "message", "details", "path", "timestamp", "correlationId" }`. Mã lỗi nghiệp vụ lấy từ SRS bảng 35 (`DETAI_KHONG_MO`, `SAI_NGANH`, `GPA_KHONG_DAT`, `HET_CHI_TIEU`, `DA_CO_DANG_KY`, `TRANG_THAI_KHONG_HOP_LE`, `THIEU_LY_DO`, `NGOAI_HAN`, `VUOT_SO_DE_TAI`, `HO_SO_THIEU`, `HOI_DONG_KHONG_HOP_LE`, `XUNG_DOT_LOI_ICH`...). Bộ lọc lỗi dùng chung do Khoa viết trong `libs/common`.
- Mã HTTP: 400 dữ liệu sai, 401 chưa xác thực, 403 không đủ quyền, 404 không có, 409 xung đột, 413 quá lớn, 422 không đạt điều kiện nghiệp vụ, 429 quá nhiều yêu cầu, 503 dịch vụ phụ thuộc không phản hồi.

### 3.3 Xác thực, phân quyền

- Mọi yêu cầu (trừ `/auth/login`, `/auth/refresh`, `/health`) mang `Authorization: Bearer <access_token>`.
- Nội dung token (payload): `sub` (mã tài khoản), `username`, `role` (`QTV`/`GV`/`SV`), `maDinhDanh` (`MaGV` hoặc `MaSV`; QTV để trống).
- **Mã giảng viên, mã sinh viên của người đang thao tác luôn lấy từ token, không nhận từ body.**
- Gateway kiểm tra vai trò theo nhóm đường dẫn (SRS bảng 32, bảng luật nằm ở đầu `apps/api-gateway/src/main.ts`). Từng dịch vụ **kiểm tra lại** token và quyền sở hữu dữ liệu (ví dụ giảng viên chỉ duyệt đăng ký của đề tài mình). Dùng `JwtAuthGuard`, `@Roles(...)`, `@CurrentUser()` từ `@app/common`.
- Khi dịch vụ này gọi dịch vụ khác, **chuyển tiếp nguyên header `Authorization`**.
- Gateway giới hạn 100 yêu cầu mỗi phút mỗi IP (P-09, trả 429) và sinh `X-Correlation-Id`: dịch vụ nên ghi lại id này trong nhật ký và chuyển tiếp khi gọi dịch vụ khác.
- Tài khoản thử nghiệm: `admin` (QTV, mật khẩu theo `ADMIN_PASS` trong `.env`), `gv01` (GV, `GV001`) và `sv01` (SV, `SV001`) với mật khẩu `Test@12345`.

### 3.4 Gọi dịch vụ khác

- Địa chỉ dịch vụ khác nằm trong `.env` (ví dụ `ACADEMIC_URL=http://localhost:3001`), không ghi cứng. Gọi thẳng cổng dịch vụ, không đi vòng qua Gateway.
- Thời gian chờ 3 giây, thử lại tối đa 3 lần, chỉ với lời gọi `GET` (P-11). Khoa viết client HTTP dùng chung có sẵn thử lại và ngắt mạch trong `libs/common`; sau khi có thì các dịch vụ dùng lại, không tự viết.
- Dịch vụ phụ thuộc không phản hồi thì trả `503` (mã `DICH_VU_KHONG_PHAN_HOI`), không để lỗi 500.
- **Không** đọc CSDL của dịch vụ khác, không tạo khóa ngoại giữa các CSDL.

### 3.5 Sự kiện (RabbitMQ)

- Exchange kiểu topic tên `datn.events`. Mỗi bên nhận có hàng đợi bền vững riêng: `q.notification`, `q.report`, `q.topic`, `q.ai`. Danh mục sự kiện ở mục 5.
- Mọi sự kiện cùng một khung JSON:

```json
{
  "eventId": "uuid",
  "eventType": "DangKyDuocDuyet",
  "version": 1,
  "occurredAt": "2026-11-05T03:15:00Z",
  "producer": "registration-service",
  "correlationId": "...",
  "data": { "maDangKy": 12, "maSV": "SV001", "maDeTai": 1 }
}
```

- Bên phát: ghi sự kiện vào bảng **outbox** cùng giao dịch với dữ liệu nghiệp vụ, một tiến trình nền đẩy sang hàng đợi.
- Bên nhận: ack thủ công **sau khi** xử lý xong, lưu `eventId` đã xử lý (ràng buộc duy nhất) và bỏ qua bản lặp. Lỗi thử lại tối đa 3 lần rồi chuyển hàng đợi chết (dead-letter).
- Phần phát và nhận dùng chung do Khoa viết trong `libs/events`. Dịch vụ khác **chỉ gọi** thư viện đó, không tự viết kết nối RabbitMQ.
- Đăng ký phát sự kiện không được làm hỏng chức năng chính: Notification, Report lỗi không được làm đăng ký hay duyệt thất bại.

### 3.6 Cấu hình (`.env`)

- Cổng, địa chỉ, tên CSDL, tham số nghiệp vụ đều đặt trong `.env`; mỗi dịch vụ có `.env.example` và **không commit `.env`**.
- Tên biến theo SRS bảng tham số: `TOPIC_MAX_PER_GV` (P-14), `DUP_HIGH`, `DUP_MEDIUM` (P-15), `AI_TOP_K` (P-16), `AI_LLM_TIMEOUT_SEC` (P-17), `COUNCIL_MIN_MEMBERS` (P-18), `SCORE_WEIGHTS` (P-19), `PASS_SCORE` (P-20), `REMIND_DAYS` (P-21), `HOURS_GUIDE`, `HOURS_COUNCIL` (P-22), `FILE_TYPES`, `FILE_MAX_MB` (P-23), `AI_LLM_ENABLED` (P-24), `IMPORT_MAX_MB`, `IMPORT_MAX_ROWS` (P-07), `EXPORT_MAX_ROWS` (P-13).

### 3.7 Thay đổi cơ sở dữ liệu

TypeORM đang để `synchronize: false`, nên **không tự tạo bảng**. Mỗi người:

- Cập nhật `apps/<dịch-vụ>/database.sql` để người mới clone chạy một lần là đủ.
- Với bảng đã có ở máy người khác, thêm file `apps/<dịch-vụ>/migrations/NN-mo-ta.sql` (chứa `ALTER`, `CREATE`) và ghi trong Pull Request để các bạn chạy bổ sung.

### 3.8 Phạm vi sửa file

- Mỗi người chỉ sửa trong thư mục dịch vụ của mình.
- Chỉ **Khoa** sửa: `libs/common`, `libs/events`, `apps/api-gateway`, `apps/auth-service`, `package.json`, `package-lock.json`, `nest-cli.json`, `tsconfig*.json`, `docker-compose.yml`, `README.md`, và phần giao diện dùng chung: `frontend_react/src/api.js`, `App.jsx`, `App.css`, `config/` (`menu.js`, `routes.jsx`), `components/` (`Topbar`, `Modal`, `ConfirmDialog`, `Toast`, `ComingSoon`).
- Khoa cài **một lần** các thư viện chung ở Giai đoạn 0 (`@nestjs/schedule`, `@nestjs/swagger`, thư viện RabbitMQ, `multer`, `exceljs`, `nodemailer`, `pdfkit`...) để không ai sửa `package.json` cùng lúc. Cần thêm thư viện nào thì nhắn Khoa.
- Giao diện: khung (sidebar, topbar, menu theo vai trò, định tuyến, chặn trang theo vai trò) **đã làm sẵn**. Mỗi người chỉ mở file trang của mình trong `frontend_react/src/pages/`, xóa `<ComingSoon />` và viết giao diện thật (xem mục 3.11).

### 3.9 Git

- Mỗi đầu việc một nhánh: `feature/<ten>/<viec-ngan>` (ví dụ `feature/khang/trang-thai-de-tai`). Mở Pull Request vào `main`, Khoa xem trước khi gộp. Không đẩy thẳng vào `main`.
- Riêng nhóm trưởng được commit thẳng vào `main` cho phần nền tảng (`libs/`, Gateway, Auth, frontend dùng chung). Thành viên vẫn làm nhánh riêng và mở Pull Request.
- Không đẩy `node_modules/` và `.env`.
- Tên commit ngắn, bắt đầu bằng tên dịch vụ: `de-tai: them duyet de tai`.

```
git checkout -b feature/<ten>/<viec>
git add <đúng file mình sửa>
git commit -m "<dich-vu>: mo ta ngan"
git pull --rebase --autostash
git push -u origin feature/<ten>/<viec>
```

Gặp conflict thì dừng lại và hỏi nhóm, không tự giải quyết bằng cách xóa mã của người khác.

### 3.10 Xong một đầu việc là khi

- [ ] Có DTO kiểm tra dữ liệu, trả đúng mã lỗi trong SRS.
- [ ] Có kiểm tra vai trò và quyền sở hữu dữ liệu.
- [ ] Phát hoặc nhận đúng sự kiện nếu SRS yêu cầu.
- [ ] `database.sql` hoặc migration đã cập nhật.
- [ ] Có ít nhất một ca thử chạy được (Postman, lưu vào `docs/postman/<ten>.json`, hoặc test tự động).
- [ ] Gọi được **qua Gateway** (cổng 3000), không chỉ gọi thẳng cổng dịch vụ.

### 3.11 Frontend: làm trang ở đâu

Khung giao diện đã có sẵn: đăng nhập, sidebar và menu theo vai trò (`config/menu.js`), topbar (tiêu đề, chuông thông báo, menu người dùng), định tuyến và chặn trang theo vai trò (`config/routes.jsx`), trang Tài khoản, Hồ sơ cá nhân, Đổi mật khẩu. **Không ai cần tự làm khung hay sửa `App.jsx`.** Hướng dẫn chi tiết và danh sách trang của từng người: `frontend_react/HUONG_DAN_VIET_TRANG.md`.

- **Làm trang:** mở file trang của mình trong `frontend_react/src/pages/` (ví dụ `DotDeTai.jsx`), xóa dòng `<ComingSoon .../>` và viết giao diện thật. Giữ nguyên tên file và `export default`.
- **Thêm trang mới** (ngoài các trang có sẵn, ví dụ Chi tiết đề tài, Hồ sơ đề tài): nhắn Khoa thêm vào `config/menu.js` và `config/routes.jsx`.
- **Quyền thật nằm ở backend.** Ẩn nút theo vai trò (`auth.getUser().role`) chỉ để giao diện gọn. Gateway và từng dịch vụ mới là nơi chặn.
- **Sinh viên và giảng viên không được gọi mọi API của QTV.** Ví dụ SV gọi `GET /tai-khoan` hoặc `POST /sinh-vien` sẽ bị 403. Mã của người đang đăng nhập lấy từ `auth.getUser().maDinhDanh`, không tra cả danh sách. Trang dùng chung cho nhiều vai trò phải gọi API theo vai trò.
- **Tránh vòng lặp tải dữ liệu.** Không đặt object hoặc hàm tạo mới mỗi lần render vào mảng phụ thuộc của `useEffect`/`useCallback`. `toast` từ `useToast()` đã được giữ ổn định, dùng được trong mảng phụ thuộc. Gateway giới hạn 100 yêu cầu/phút/IP nên vòng lặp sẽ nhanh chóng gây lỗi 429.
- **Chuông thông báo:** Lịch nối số chưa đọc vào `Topbar` (tham số `unread`) khi API sẵn sàng.
- Các trang cũ `SinhVien.jsx`, `DeTai.jsx`, `DangKy.jsx` sẽ được chủ sở hữu làm lại theo SRS (ví dụ `SinhVien.jsx` còn trường mật khẩu, `DangKy.jsx` đang gọi `/sinh-vien`).
- Sau khi nâng cấp phân quyền, mọi người phải **đăng nhập lại** (phiên cũ vai trò `admin` bị từ chối).

---

## 4. Phần việc từng người

### 4.1 Khoa (nhóm trưởng): nền tảng, Auth, Registration, AI

**Được sửa:** `libs/*`, `apps/api-gateway`, `apps/auth-service`, `apps/dang-ky-service`, `apps/ai-service` (Python), các file dùng chung ở mục 3.8, `docker-compose.yml`, `frontend_react` (phần dùng chung).

#### A. Nền tảng (Giai đoạn 0, làm trước, báo vào nhóm khi từng mục xong)

- [x] **A1. Vai trò trong token (làm đầu tiên).** Token mang `role` (`QTV`/`GV`/`SV`) và `maDinhDanh`. Thêm decorator `@Roles(...)` và `RolesGuard` vào `libs/common`, cùng decorator lấy người dùng hiện tại (`@CurrentUser()`). (FR-21)
- [x] **A2. Auth có CSDL** (xem mục C, làm cùng lúc) và seed tài khoản thử nghiệm: `admin` (QTV), `gv01` (GV, `GV001`), `sv01` (SV, `SV001`) để mọi người thử phân quyền.
- [ ] **A3. Bộ lọc lỗi thống nhất, tiện ích phân trang** trong `libs/common` (`X-Correlation-Id` đã làm ở Gateway; còn bộ lọc lỗi dùng chung cho các dịch vụ).
- [ ] **A4. Client HTTP dùng chung** (thời gian chờ, thử lại GET, ngắt mạch) trong `libs/common`. (NFR-08, P-11, P-12)
- [ ] **A5. `libs/events`**: phát qua outbox, nhận idempotent, hàng đợi chết, khung sự kiện ở mục 3.5; kèm RabbitMQ trong `docker-compose.yml` (có thể chạy riêng RabbitMQ và MySQL trước).
- [ ] **A6. Cài chung thư viện** (xem 3.8), commit `package.json` và lock **một lần**.
- [x] **A7. Gateway:** thêm tuyến `/khoa`, `/nganh`, `/giang-vien`, `/tai-khoan`, `/dot-de-tai`, `/hoi-dong`, `/thong-bao`, `/nhat-ky`, `/bao-cao`, `/ai` (cổng đích: Academic 3001, Auth 3004, Topic 3002, Notification 3005, Report 3006, AI 3007); kiểm tra vai trò theo SRS bảng 32; giới hạn 100 yêu cầu mỗi phút mỗi IP (P-09); sinh `X-Correlation-Id`; ghi nhật ký truy cập; CORS. Địa chỉ đích đặt trong `.env.example` của Gateway. (FR-21) Ghi chú: luật `POST /dang-ky` đang cho QTV vì trang quản lý hiện tại, **bỏ sau khi xong B9**.
- [x] **A8. Frontend dùng chung:** menu theo vai trò, tuyến, topbar, trang đăng nhập, trang giữ chỗ cho các bạn điền, trang Tài khoản, Hồ sơ cá nhân, Đổi mật khẩu. Đã bỏ cứng chữ `admin`.

#### B. Registration Service (cổng 3003) — FR-10→14

Hiện trạng: tạo, sửa, xóa đăng ký cơ bản, trạng thái là chuỗi `Cho duyet`, chưa duyệt đúng quy tắc, chưa khóa chỉ tiêu.

- [x] **B1. Chuẩn hóa dữ liệu:** trạng thái `CHO_DUYET`/`DA_DUYET`/`BI_TU_CHOI`/`DA_HUY`, cột `hieuLuc`, `lyDoTuChoi`; ràng buộc **mỗi sinh viên tối đa một đăng ký còn hiệu lực** (BR-05, dùng ràng buộc duy nhất của CSDL, không chỉ kiểm tra trong mã); bảng `ChiTieuDeTai` (dòng khóa dùng khi duyệt).
- [x] **B2. Kiểm tra điều kiện (FR-11):** đề tài `DANG_MO` (BR-01), cùng ngành (BR-02), GPA đủ (BR-03), chưa đủ chỉ tiêu (BR-04), chưa có đăng ký còn hiệu lực (BR-05), còn trong hạn đợt (BR-18). Lấy dữ liệu bằng HTTP từ Academic và Topic, **chuyển tiếp `Authorization`**. Trả `DETAI_KHONG_MO`, `SAI_NGANH`, `GPA_KHONG_DAT` (422); `HET_CHI_TIEU`, `DA_CO_DANG_KY` (409); `NGOAI_HAN` (422).
- [ ] **B3. `POST /dang-ky` (SV):** mã sinh viên lấy từ token; ghi `CHO_DUYET`; phát EV-06; trả kết quả ngay, không chờ thông báo. (FR-10)
- [ ] **B4. `PATCH /dang-ky/:id/huy` (SV):** chỉ đăng ký của mình, chỉ khi `CHO_DUYET` (BR-06); phát EV-09. (FR-12)
- [ ] **B5. `PATCH /dang-ky/:id/duyet` và `/tu-choi` (GV):** chỉ giảng viên phụ trách đề tài (BR-08); khi duyệt, **trong cùng một giao dịch** khóa dòng chỉ tiêu (`SELECT ... FOR UPDATE`), hỏi lại Topic trạng thái và chỉ tiêu, kiểm tra `số đã duyệt < chỉ tiêu` (BR-04); từ chối bắt buộc có lý do (`THIEU_LY_DO`, BR-10); phát EV-07 hoặc EV-08. (FR-13)
- [ ] **B6. `GET /dang-ky` (theo quyền):** SV chỉ thấy của mình, GV thấy của đề tài mình, QTV thấy tất cả; lọc theo đề tài, trạng thái; phân trang. Tên sinh viên, tên đề tài lấy **theo lô**; dịch vụ kia lỗi thì hiển thị theo mã (giảm chức năng). (FR-14)
- [ ] **B7. Sự kiện:** phát EV-06, 07, 08, 09 và EV-11 (`ThaoTacQuanTrong`) qua `libs/events`.
- [ ] **B8. Kiểm thử đồng thời:** hai giảng viên duyệt cùng lúc hai đăng ký vào đề tài chỉ còn một chỗ, chỉ một thành công.
- [ ] **B9. Frontend:** trang đăng ký theo vai trò (SV đăng ký, hủy; GV duyệt, từ chối kèm lý do; QTV xem). Trang hiện tại tải cả danh sách `/sinh-vien` để hiển thị tên: SV không nên đọc danh sách của người khác, phải sửa (mã SV lấy từ token, tên lấy theo lô).

#### C. Auth Service (cổng 3004) — FR-20→22

Trạng thái: đã có CSDL `qldatn_auth`, vai trò trong token, quản lý tài khoản. Phần còn lại là phát sự kiện.

- [x] **C1. CSDL `qldatn_auth`:** bảng `TaiKhoan` (mã, tên đăng nhập duy nhất, mật khẩu băm bcrypt, vai trò, mã định danh, trạng thái, số lần sai, khóa đến) và `RefreshToken` (băm token, hạn, đã thu hồi). Tạo tài khoản ban đầu khi bảng còn trống.
- [x] **C2. Đăng nhập, làm mới, đăng xuất (FR-20):** token chứa `sub`, `username`, `role`, `maDinhDanh`; làm mới theo xoay vòng (token cũ vô hiệu ngay, cập nhật có điều kiện để chống làm mới đồng thời); đăng xuất thu hồi; sai mật khẩu quá `LOGIN_MAX_FAILS` lần thì khóa tạm `LOGIN_LOCK_MINUTES` (403); thông báo lỗi **không tiết lộ** tài khoản có tồn tại hay không.
- [x] **C3. Quản lý tài khoản (FR-22, QTV):** `POST /tai-khoan` (tạo cho SV hoặc GV, xác minh `maDinhDanh` với Academic khi bật `VERIFY_MA_DINH_DANH=true`, 404 nếu không có; trùng tên đăng nhập 409), `GET /tai-khoan`, `GET /tai-khoan/me` (mọi vai trò), `PATCH /tai-khoan/:id/khoa` và `/mo-khoa` (khóa thì thu hồi refresh token), `PATCH /tai-khoan/:id/dat-lai-mat-khau`, `PATCH /tai-khoan/me/mat-khau` (nhập mật khẩu cũ, sai trả 400, thu hồi mọi phiên). Mật khẩu tối thiểu `PASSWORD_MIN_LENGTH` ký tự (BR-13).
- [ ] **C4. Sự kiện:** phát EV-10 (`TrangThaiTaiKhoanThayDoi`) khi khóa hoặc mở khóa và EV-11, sau khi có `libs/events`.
- [x] **C5. Frontend:** trang quản lý tài khoản (QTV), Hồ sơ cá nhân, Đổi mật khẩu.

#### D. AI Service (cổng 3007, **Python + FastAPI**, thư mục `apps/ai-service`) — FR-32, FR-33

Đây là phần cốt lõi do Khoa đảm nhận. Không nằm trong build NestJS: có `requirements.txt`, `.env.example`, `README.md` và lệnh chạy riêng (`uvicorn`). Kết quả AI **chỉ để tham khảo**, không tự duyệt hay từ chối (BR-22).

- [ ] **D1. Nghiên cứu và chọn mô hình embedding (OI-07):** dựng bộ 50 đến 100 đề tài mẫu (có cặp cố ý trùng, gần giống, khác hẳn), thử vài mô hình đa ngôn ngữ chạy cục bộ (ví dụ `paraphrase-multilingual-MiniLM-L12-v2`, `intfloat/multilingual-e5-base`, `BAAI/bge-m3`, hoặc một mô hình sinh vector tiếng Việt), đo độ chính xác, **chọn mô hình và chỉnh ngưỡng** `DUP_HIGH` (0,85) và `DUP_MEDIUM` (0,70). Ghi kết quả vào `apps/ai-service/README.md`.
- [ ] **D2. Kho vector Chroma:** hai collection `de_tai` và `chuyen_mon_giang_vien`; lưu cùng `maDeTai`, `maNganh`, `trangThai`.
- [ ] **D3. Kiểm tra trùng (RAG), FR-32:**
  1. Nhận EV-12 (`q.ai`) hoặc `POST /ai/kiem-tra-trung` (xem trước, GV/QTV).
  2. Chuyển tên, mô tả, từ khóa thành vector; tìm `AI_TOP_K` (5) đề tài gần nhất, **loại chính đề tài đang xét và đề tài `BI_TU_CHOI`, `DA_HUY`**.
  3. Mức: `CAO` từ 0,85; `TRUNG_BINH` từ 0,70; còn lại `THAP` (kho trống thì `THAP` kèm ghi chú).
  4. Sinh nhận xét: đưa đề tài mới và K đề tài tìm được cho mô hình ngôn ngữ, yêu cầu **chỉ kết luận dựa trên các đề tài này**, nêu mã đề tài trích dẫn, nói rõ khi không chắc.
  5. Mô hình ngôn ngữ tắt (`AI_LLM_ENABLED=false` mặc định), lỗi hoặc quá `AI_LLM_TIMEOUT_SEC` giây thì dùng **nhận xét theo mẫu** dựng từ điểm và danh sách đề tài gần giống (NFR-16).
  6. Lưu bảng `KetQuaTuongDong` (CSDL `qldatn_ai`), thêm đề tài vào kho vector, phát EV-13.
  7. Đầu ra: mức, điểm cao nhất, danh sách (mã, tên, điểm), nhận xét, nguồn nhận xét (`LLM` hoặc `MAU`).
- [ ] **D4. Gợi ý thành viên hội đồng, FR-33 (QTV):** `GET /ai/goi-y-hoi-dong?maDeTai=&soNguoi=8`. Lấy đề tài (Topic) và giảng viên (Academic); loại giảng viên hướng dẫn và người cùng khoa (BR-20); hồ sơ chuyên môn của mỗi giảng viên = từ khóa và tên các đề tài đã hướng dẫn (Topic: `GET /de-tai?maGV=`) chuyển thành vector; xếp hạng theo độ tương đồng; trả mã, tên, khoa, điểm, lý do ngắn. Giảng viên ít dữ liệu thì xếp thấp kèm ghi chú. Đề tài không tồn tại: 404; dịch vụ khác lỗi: 503.
- [ ] **D5. Nạp kho vector:** `POST /ai/nap-kho` (QTV) đưa các đề tài đã có vào kho; chạy được lại nhiều lần.
- [ ] **D6. Chịu lỗi:** AI Service tắt thì Topic vẫn nhận đề tài với mức `CHUA_KIEM_TRA` và kiểm tra bù khi AI chạy lại (sự kiện nằm sẵn trong hàng đợi); gợi ý hội đồng khi lỗi trả 503.
- [ ] **D7. Kiểm thử:** bộ ca thử cho D1 và D3 (đề tài trùng hẳn, gần giống, khác hẳn, kho trống, LLM tắt).
- [ ] **D8. Frontend:** hiển thị cảnh báo mức trùng khi QTV duyệt đề tài; nút "Gợi ý thành viên" khi lập hội đồng.

#### E. Hoàn thiện, tích hợp (Giai đoạn 5)

- [ ] **E1. `docker-compose.yml`:** MySQL, RabbitMQ, các dịch vụ NestJS, AI Service, Gateway, frontend; mạng nội bộ chỉ mở cổng Gateway và frontend.
- [ ] **E2. `/health` cho mọi dịch vụ** (mẫu do Khoa viết, mỗi người thêm vào dịch vụ của mình) và Gateway tổng hợp tình trạng.
- [ ] **E3. Swagger:** mỗi dịch vụ công bố `/api-docs`; Gateway tổng hợp (FR-24). Mỗi người cấu hình cho dịch vụ của mình theo mẫu của Khoa.
- [ ] **E4. Kịch bản kiểm thử toàn hệ thống** theo SRS mục 9.3 và cập nhật README, SRS mục 10.2.

---

### 4.2 Khương: Academic Service và hội đồng nghiệm thu

**Được sửa:** `apps/sinh-vien-service/**` (đổi tên thư mục thành `academic-service` chỉ khi Khoa đồng ý, vì dính `nest-cli.json`); trong Topic **chỉ** `apps/de-tai-service/src/hoi-dong/**` và thêm đúng một dòng import vào `de-tai-service.module.ts` (báo Khang); trang giao diện của mình.

#### A. Academic Service (cổng 3001) — FR-01→05

Hiện trạng: chỉ có sinh viên (`MaSV`, họ tên, email, lớp), còn cột `Password` và `Token` (SRS yêu cầu **không** lưu thông tin đăng nhập ở dịch vụ này).

- [ ] **A1. Làm trước hết, vì mọi người đang chờ:** `GET /nganh/:ma`, `GET /giang-vien/:maGV`, `GET /sinh-vien/:maSV` trả đủ trường cần thiết (ngành, GPA, trạng thái, khoa), 404 nếu không có.
- [ ] **A2. CSDL:** thêm bảng `Khoa`, `Nganh`, `GiangVien`; `SinhVien` thêm `MaNganh`, `GPA` (DECIMAL, 0 đến 4,0), `TrangThai`; **bỏ** cột `Password`, `Token`; mọi bảng có `TrangThai` (xóa mềm). Cập nhật `database.sql` và migration.
- [ ] **A3. Khoa (FR-01), QTV ghi, mọi vai trò xem:** CRUD `/khoa`, tìm kiếm, phân trang; mã khoa duy nhất (409); **không xóa khoa còn ngành hoặc giảng viên đang hoạt động** (409), khi xóa được phép thì chuyển `NGUNG_HOAT_DONG`.
- [ ] **A4. Ngành (FR-02):** CRUD `/nganh`; khoa phải tồn tại và đang hoạt động (404); mã ngành duy nhất; ngành còn sinh viên đang hoạt động thì không xóa (409); xóa mềm.
- [ ] **A5. Sinh viên (FR-03):** CRUD `/sinh-vien`; MaSV duy nhất; email đúng định dạng nếu có; GPA từ 0 đến 4,0 (400 nếu sai, ví dụ 4,5); ngành tồn tại và hoạt động (404); lọc theo ngành, lớp; tìm kiếm; phân trang; thêm tra cứu **theo lô** (`GET /sinh-vien?maSV=SV001,SV002`) cho Registration. SV chỉ xem hồ sơ của mình, GV xem sinh viên đăng ký đề tài của mình (hỏi Registration nếu cần, không đọc CSDL của họ). Lưu ý: Gateway cho mọi vai trò đọc `/sinh-vien` (GET), chỉ QTV được thêm, sửa, xóa. Việc SV chỉ xem hồ sơ của mình và GV chỉ xem sinh viên liên quan do Academic Service kiểm tra, không dựa vào Gateway.
- [ ] **A6. Giảng viên (FR-04):** CRUD `/giang-vien`, MaGV duy nhất, khoa tồn tại; xóa mềm; giảng viên `NGUNG_HOAT_DONG` không đề xuất đề tài mới; lọc theo khoa; GV chỉ xem hồ sơ của mình.
- [ ] **A7. Nhập từ tệp (FR-05, ưu tiên trung bình):** `POST /sinh-vien/nhap-tep` và `POST /giang-vien/nhap-tep` (multipart, `.xlsx` hoặc `.csv`); tối đa 5 MB và 1.000 dòng (413 nếu vượt); sai định dạng hoặc thiếu cột 400; mỗi dòng kiểm tra như khi thêm lẻ; dòng đúng được lưu, dòng sai không làm hỏng cả lô; trả báo cáo số dòng thành công, số dòng lỗi, danh sách lỗi kèm lý do. Có tệp mẫu.
- [ ] **A8. Sự kiện:** sau mỗi thay đổi sinh viên phát **EV-01** (`maSV, hoTen, lop, maNganh, gpa, trangThai`); thao tác quan trọng phát **EV-11**.
- [ ] **A9. Chuẩn hóa JSON camelCase (OI-01):** đổi `MaSV` thành `maSV` trong phản hồi và sửa `SinhVien.jsx`; **báo Khoa trước**, vì `DangKy.jsx` và Registration cũng đang đọc `MaSV`.
- [ ] **A10. Bật `ValidationPipe` và `enableCors`** đúng mẫu các dịch vụ khác (hiện `main.ts` của dịch vụ này chưa có `ValidationPipe`); CORS thật sự đã được Gateway xử lý nên `enableCors` ở dịch vụ chỉ để gọi thử trực tiếp khi phát triển.
- [ ] **A11. Frontend:** trang Khoa, Ngành, Giảng viên; trang Sinh viên bổ sung GPA, ngành, lọc, nhập tệp. Ngoài ra bổ sung họ tên, khoa, lớp vào trang Hồ sơ cá nhân (`HoSoCaNhan.jsx`, hiện chỉ có thông tin tài khoản).

#### B. Hội đồng và chấm điểm trong Topic (cổng 3002, thư mục `hoi-dong/`) — FR-28, FR-29

Bắt đầu sau khi Khang có vòng đời đề tài (trạng thái `CHO_NGHIEM_THU`) chạy được và Khoa có thư viện sự kiện.

- [ ] **B1. CSDL** (trong `qldatn_detai`, thêm bằng migration riêng của Khương): `HoiDong`, `ThanhVienHoiDong` (vai trò `CHU_TICH`, `THU_KY`, `PHAN_BIEN`, `UY_VIEN`), `DiemNghiemThu` (điểm từng thành viên theo từng tiêu chí). Cập nhật SRS 8.3.2 là nguồn.
- [ ] **B2. Lập hội đồng (FR-28, QTV):** `POST /hoi-dong` cho đề tài ở `CHO_NGHIEM_THU` (sai trạng thái 409); tối thiểu `COUNCIL_MIN_MEMBERS` (3) thành viên và **số lẻ**, đúng một Chủ tịch và một Thư ký (`HOI_DONG_KHONG_HOP_LE`, 422).
- [ ] **B3. Xung đột lợi ích (BR-20):** thành viên **không** là giảng viên hướng dẫn và **không cùng khoa** với giảng viên hướng dẫn (gọi Academic `GET /giang-vien/:maGV` lấy khoa); vi phạm trả `XUNG_DOT_LOI_ICH` (422) kèm danh sách người xung đột; QTV được xác nhận ngoại lệ cùng khoa **kèm lý do** và ngoại lệ được ghi nhật ký (EV-11).
- [ ] **B4. Chốt hội đồng (QTV, `PATCH /hoi-dong/:id/chot`):** khác với `chot-diem` (Chủ tịch, mục B6). Phát **EV-15** (`HoiDongDuocLap`: `maHoiDong, maDeTai, thanhVien, ngayHop`).
- [ ] **B5. Chấm điểm (FR-29, GV là thành viên):** `PUT /hoi-dong/:id/diem`; chỉ thành viên hội đồng được chấm (403); điểm 0 đến 10 (400); mỗi người một điểm cho mỗi tiêu chí, sửa được đến khi Chủ tịch chốt; tiêu chí và trọng số lấy từ `SCORE_WEIGHTS` (P-19: nội dung 20%, phương pháp 20%, kết quả 40%, báo cáo 20%).
- [ ] **B6. Kết luận:** `PATCH /hoi-dong/:id/chot-diem` (Chủ tịch); chưa chốt thì không tính (409); điểm thành viên = trung bình có trọng số, điểm đề tài = trung bình các thành viên (BR-21); `Đạt` khi từ `PASS_SCORE` (5,0). Đạt thì đề tài sang `DA_NGHIEM_THU`; Chưa đạt thì về `DANG_THUC_HIEN` (tối đa một lần chỉnh sửa, sau đó QTV quyết định). Việc đổi trạng thái đề tài dùng hàm của Khang, **không tự ghi vào bảng DeTai**. Phát **EV-16** (`maDeTai, maGV, ketLuan, diemTB`).
- [ ] **B7. Tra cứu:** `GET /hoi-dong/:id`, `GET /hoi-dong?maDeTai=`.
- [ ] **B8. Frontend:** màn hình lập hội đồng (kèm nút gợi ý AI của Khoa), màn hình chấm điểm cho thành viên.

---

### 4.3 Khang: Topic Service lõi (cổng 3002) — FR-06→09, FR-25→27

**Được sửa:** `apps/de-tai-service/**` **trừ** thư mục `hoi-dong/` (của Khương); trang giao diện của mình.

Hiện trạng: `DeTai` chỉ có tên, mô tả, giảng viên hướng dẫn (chuỗi), số lượng tối đa. Chưa có trạng thái, ngành, GPA yêu cầu, đợt, hồ sơ.

- [ ] **A0. Làm ngay ngày đầu:** đăng vào nhóm dạng JSON của `GET /de-tai/:id` mà Registration và AI cần: `maDeTai, tenDeTai, moTa, tuKhoa, maGV, maNganh, gpaYeuCau, chiTieu, trangThai, maDot, soDaDuyet, mucTrung`, kèm các mốc của đợt (`ngayMoDangKy`, `ngayDongDangKy`) để Registration kiểm tra BR-18.
- [ ] **A1. CSDL:** mở rộng `DeTai` (`MaGV`, `MaNganh`, `GpaYeuCau`, `ChiTieu`, `TrangThai`, `LyDoTuChoi`, `MaDot`, `TuKhoa`, `SoDaDuyet` bản sao hiển thị, `MucTrung`, xóa mềm); bảng `DotDeTai` và `HoSoDeTai` (mỗi lần nộp một phiên bản). Cập nhật `database.sql` và migration.
- [ ] **A2. Đề xuất đề tài (FR-06, GV):** `POST /de-tai`; `maGV` lấy từ token; ngành tồn tại (gọi Academic, 404; Academic lỗi 503); chỉ tiêu nguyên từ 1 trở lên, GPA yêu cầu 0 đến 4,0 (400); trạng thái ban đầu `CHO_DUYET`; mỗi giảng viên tối đa `TOPIC_MAX_PER_GV` (5) đề tài còn hiệu lực trong đợt (`VUOT_SO_DE_TAI`, 409); đề tài thuộc đợt đang mở và còn hạn (`NGOAI_HAN`, 422); phát **EV-02** và **EV-12** (`DeTaiCanKiemTraTrung`). **Đề tài vẫn được nhận nếu AI Service không phản hồi** (mức trùng `CHUA_KIEM_TRA`).
- [ ] **A3. Sửa, xóa (FR-07):** `PATCH /de-tai/:id`, `DELETE /de-tai/:id`; GV chỉ đề tài của mình (403, BR-08); chỉ khi không còn đăng ký còn hiệu lực (409, BR-07); sửa tên, ngành, GPA yêu cầu hoặc chỉ tiêu của đề tài đã duyệt thì về `CHO_DUYET`; xóa mềm; QTV sửa mọi đề tài; phát **EV-05**.
- [ ] **A4. Duyệt, đóng, mở (FR-08, QTV):** `PATCH /de-tai/:id/duyet`, `/tu-choi` (bắt buộc lý do, `THIEU_LY_DO`), `/dong`, `/mo`; chuyển hợp lệ: `CHO_DUYET` sang `DANG_MO` hoặc `BI_TU_CHOI`; `DANG_MO` và `DA_DONG` qua lại; sai trả `TRANG_THAI_KHONG_HOP_LE` (409); đề tài đã đóng không nhận đăng ký mới nhưng giữ các đăng ký đã duyệt (BR-15); phát **EV-03** hoặc **EV-04**.
- [ ] **A5. Tra cứu (FR-09):** `GET /de-tai` (từ khóa, ngành, giảng viên, trạng thái, phân trang) và `GET /de-tai/:id`, **lọc theo vai trò**: SV chỉ thấy `DANG_MO`, GV thấy của mình và `DANG_MO`, QTV thấy tất cả; hiển thị số chỗ còn lại = chỉ tiêu trừ `soDaDuyet`; hỗ trợ `GET /de-tai?maGV=` (AI cần).
- [ ] **A6. Nhận sự kiện (`q.topic`):** EV-06, 07, 08, 09 cập nhật `SoDaDuyet` (bản sao hiển thị; quyết định duyệt vẫn dựa trên số liệu của Registration); EV-13 cập nhật `MucTrung`. Bỏ qua sự kiện cũ hơn trạng thái đã có (so `version`, `occurredAt`).
- [ ] **B1. Đợt đề tài (FR-25, QTV):** `/dot-de-tai` (CRUD); mốc theo thứ tự: mở đăng ký, đóng đăng ký, hạn tiến độ, hạn tổng kết, nghiệm thu (sai 400, BR-18); sửa mốc của đợt đã đóng 409; trạng thái `SAP_MO`, `DANG_MO`, `DA_DONG` chuyển **tự động** đến ngày bằng tiến trình định kỳ (`@nestjs/schedule`) hoặc khi QTV đóng sớm; đóng đợt thì các đề tài `DANG_MO` của đợt chuyển `DA_DONG` (BR-15); phát **EV-14**.
- [ ] **B2. Chuyển trạng thái nhiều bước và kiểm soát hồ sơ (FR-26):** `PATCH /de-tai/:id/trang-thai`; chỉ cho chuyển theo bảng ở SRS 6.8 (sai `TRANG_THAI_KHONG_HOP_LE`, BR-19); `DA_DONG` sang `DANG_THUC_HIEN`: QTV xác nhận, có ít nhất một đăng ký đã duyệt (hỏi Registration) và có hồ sơ Thuyết minh (`HO_SO_THIEU`, 422); `DANG_THUC_HIEN` sang `CHO_NGHIEM_THU`: GV phụ trách đề nghị, có Báo cáo tổng kết nộp trong hạn (`NGOAI_HAN`); `CHO_NGHIEM_THU` sang `DA_NGHIEM_THU` hoặc quay lại do hội đồng (Khương gọi hàm của Khang). Mỗi lần đổi phát **EV-05** và EV-11. **Hãy viết sẵn một hàm dùng chung `chuyenTrangThai(maDeTai, trangThaiDich, nguoiThucHien)`** để phần hội đồng gọi vào.
- [ ] **B3. Nộp hồ sơ (FR-27):** `POST /de-tai/:id/ho-so` (multipart), `GET /de-tai/:id/ho-so`; loại `THUYET_MINH`, `BAO_CAO_TIEN_DO`, `BAO_CAO_TONG_KET`; chỉ GV phụ trách hoặc SV có đăng ký `DA_DUYET` (403); chỉ `.pdf` hoặc `.docx`, tối đa `FILE_MAX_MB` (400, 413); **mỗi lần nộp là một phiên bản mới, không ghi đè** (BR-23); nộp sau hạn của đợt bị từ chối (`NGOAI_HAN`); lưu tệp ở thư mục kho tệp của Topic (không đẩy lên Git), đường dẫn lưu trong `HoSoDeTai`; phát **EV-17**.
- [ ] **B4. Frontend:** trang đề tài theo vai trò (GV đề xuất, sửa; QTV duyệt, từ chối kèm lý do; SV xem đề tài đang mở), trang đợt, trang hồ sơ, hiển thị mức trùng của AI. Trang Chi tiết đề tài và Hồ sơ đề tài chưa có trong menu: nhắn Khoa thêm vào `config/menu.js` và `config/routes.jsx`.
- [ ] **B5. Kiểm thử:** từng chuyển trạng thái hợp lệ và không hợp lệ; sinh viên không xem được đề tài chưa mở.

---

### 4.4 Lịch: Notification Service (cổng 3005, mới) — FR-15, FR-23, FR-30

**Được sửa:** `apps/notification-service/**` (tạo mới bằng Nest CLI; hỏi Khoa để thêm vào `nest-cli.json`), trang giao diện của mình.

- [ ] **A1. Khung dịch vụ:** dựng `apps/notification-service` giống các dịch vụ khác (`main.ts`, `.env.example`, `database.sql`, cổng 3005, JWT guard từ `libs/common`). CSDL `qldatn_thongbao`: `ThongBao` (người nhận, loại, tiêu đề, nội dung, đã đọc, `MaSuKien` duy nhất), `NhatKy` (chỉ thêm), `LichNhac`, `SuKienDaXuLy`.
- [ ] **A2. Script phát sự kiện giả** `apps/notification-service/scripts/` để thử mà không cần chờ các dịch vụ khác (dùng thư viện của Khoa).
- [ ] **B1. Nhận sự kiện và tạo thông báo (FR-15):** nghe `q.notification` với các khóa ở mục 5; **idempotent theo `eventId`** (không tạo trùng); xử lý bất đồng bộ.
  - `DangKyDuocTao` → giảng viên của đề tài.
  - `DangKyDuocDuyet`, `DangKyBiTuChoi` → sinh viên.
  - `DeTaiDuocDeXuat` → quản trị viên (người nhận là vai trò `QTV`).
  - `DeTaiDuocDuyet`, `DeTaiBiTuChoi` → giảng viên.
  - `KetQuaKiemTraTrung` mức `CAO` → quản trị viên.
  - `TrangThaiTaiKhoanThayDoi` → chủ tài khoản.
  - `HoiDongDuocLap`, `KetQuaNghiemThu`, `HoSoDuocNop` → người liên quan.
- [ ] **B2. Hộp thư (FR-15):** `GET /thong-bao` (của mình, lọc chưa đọc, phân trang), `PATCH /thong-bao/:id/da-doc`, `PATCH /thong-bao/da-doc-tat-ca`. Người dùng chỉ thấy thông báo của mình (lấy `maDinhDanh` và `role` từ token).
- [ ] **B3. Email:** gửi thêm email khi có cấu hình SMTP (`nodemailer`); gửi thất bại thử lại theo chính sách, **thông báo trong hộp thư vẫn được giữ**.
- [ ] **C1. Nhật ký hoạt động (FR-23):** nhận **EV-11** từ mọi dịch vụ; mỗi bản ghi có thời điểm, người thực hiện, vai trò, hành động, đối tượng, kết quả, IP; **chỉ thêm, không sửa, không xóa** (BR-16, không có API sửa xóa); `GET /nhat-ky` (chỉ QTV, 403 nếu khác) lọc theo thời gian, người dùng, hành động, phân trang.
- [ ] **D1. Nhắc hạn tự động (FR-30), làm ở Giai đoạn 3:** từ **EV-14** tạo lịch nhắc cho hạn nộp báo cáo (GV và SV của đề tài `DANG_THUC_HIEN`); từ **EV-15** tạo lịch nhắc họp (thành viên hội đồng và GV hướng dẫn); bộ lập lịch quét **mỗi giờ**, gửi ở mốc `REMIND_DAYS` (trước 3 ngày và 1 ngày); nhận **EV-17** thì hủy lịch nhắc tương ứng; mỗi mốc và mỗi người **chỉ nhắc một lần** (BR-24); mốc của đợt đổi thì lịch chưa gửi bị hủy và tạo lại.
- [ ] **E1. Frontend:** biểu tượng chuông và danh sách thông báo (số chưa đọc, nối vào `Topbar` qua tham số `unread`; nhờ Khoa nếu cần sửa `Topbar`), trang Thông báo (`ThongBao.jsx`), trang nhật ký cho QTV (`NhatKy.jsx`).

---

### 4.5 Huy: Report Service (cổng 3006, mới) — FR-16→19, FR-31

**Được sửa:** `apps/report-service/**` (tạo mới bằng Nest CLI; hỏi Khoa để thêm vào `nest-cli.json`), trang giao diện của mình.

Nguyên tắc: Report **không truy vấn trực tiếp** CSDL của dịch vụ khác, mà giữ **bản sao đọc** dựng từ sự kiện (SRS 7.3.7).

- [ ] **A1. Khung dịch vụ:** dựng `apps/report-service` (cổng 3006, `.env.example`, `database.sql`, JWT guard). CSDL `qldatn_baocao` với `SinhVienBanSao`, `DeTaiBanSao`, `DangKyBanSao`, `KetQuaNghiemThuBanSao`, `ThamGiaHoiDongBanSao`, `SuKienDaXuLy`.
- [ ] **A2. Script phát sự kiện giả** để thử khi các dịch vụ khác chưa phát (dùng thư viện của Khoa, giống Lịch).
- [ ] **B1. Dựng bản sao đọc:** nghe `q.report` với các khóa ở mục 5 (EV-01, 02, 03, 05, 06, 07, 08, 09, 15, 16); idempotent theo `eventId`; bỏ qua sự kiện cũ hơn trạng thái đã có.
- [ ] **B2. Trang tổng quan (FR-16):** `GET /bao-cao/tong-quan` theo vai trò: QTV (số sinh viên, giảng viên, đề tài và đăng ký theo trạng thái), GV (số đề tài của mình, số đăng ký chờ duyệt), SV (trạng thái đăng ký của mình, số đề tài đang mở đúng ngành). Chưa có dữ liệu thì trả chỉ số bằng 0.
- [ ] **B3. Thống kê đề tài (FR-17, QTV và GV):** `GET /bao-cao/de-tai`; tỷ lệ lấp đầy = số đã duyệt / chỉ tiêu theo đề tài, ngành, giảng viên; danh sách đề tài chưa có sinh viên; **GV chỉ thấy đề tài mình**; không có dữ liệu trả danh sách rỗng.
- [ ] **B4. Thống kê sinh viên (FR-18, QTV):** `GET /bao-cao/sinh-vien`; đã đăng ký (có đăng ký `CHO_DUYET` hoặc `DA_DUYET`) và chưa đăng ký theo ngành, lớp; kèm danh sách sinh viên chưa đăng ký để nhắc.
- [ ] **B5. Tên ngành, số giảng viên:** gọi Academic khi cần (SRS 7.3.7); lỗi thì hiển thị theo mã.
- [ ] **C1. Xuất báo cáo (FR-19, ưu tiên thấp):** `GET /bao-cao/xuat?loai=&dinhDang=xlsx|pdf` (loại: đề tài, đăng ký, sinh viên chưa đăng ký, thống kê); tối đa `EXPORT_MAX_ROWS` (5.000) dòng (413 nếu vượt, yêu cầu thu hẹp bộ lọc); định dạng khác 400; nội dung theo đúng quyền xem của người yêu cầu. (Gateway chỉ cho GV và QTV gọi `/bao-cao/xuat`.)
- [ ] **D1. Quy đổi giờ NCKH (FR-31, ưu tiên thấp, Giai đoạn 3):** `GET /bao-cao/gio-nckh?namHoc=&maGV=`; chỉ tính đề tài `DA_NGHIEM_THU` có kết luận **Đạt**; giờ = số đề tài hướng dẫn × `HOURS_GUIDE` + số lần tham gia hội đồng × `HOURS_COUNCIL` (P-22: 30 giờ và 3 giờ, thay bằng quy định của trường khi có, OI-08); GV chỉ xem của mình (403); xuất được Excel; chưa có dữ liệu nghiệm thu thì bằng 0.
- [ ] **E1. Frontend:** trang tổng quan (`TongQuan.jsx`, mở đầu theo vai trò), thống kê có biểu đồ, xuất báo cáo, giờ NCKH. Trang Xuất báo cáo chưa có trong menu: nhắn Khoa thêm.

---

## 5. Danh mục sự kiện (nguồn: SRS 7.6)

| Mã    | Sự kiện                    | Khóa định tuyến         | Bên phát            | Bên nhận         |
| ----- | -------------------------- | ----------------------- | ------------------- | ---------------- |
| EV-01 | `SinhVienThayDoi`          | `sinhvien.changed`      | Khương (Academic)   | Huy (Report)     |
| EV-02 | `DeTaiDuocDeXuat`          | `detai.proposed`        | Khang (Topic)       | Lịch, Huy        |
| EV-03 | `DeTaiDuocDuyet`           | `detai.approved`        | Khang               | Lịch, Huy        |
| EV-04 | `DeTaiBiTuChoi`            | `detai.rejected`        | Khang               | Lịch             |
| EV-05 | `DeTaiCapNhat`             | `detai.updated`         | Khang               | Huy              |
| EV-06 | `DangKyDuocTao`            | `dangky.created`        | Khoa (Registration) | Lịch, Huy, Khang |
| EV-07 | `DangKyDuocDuyet`          | `dangky.approved`       | Khoa                | Lịch, Huy, Khang |
| EV-08 | `DangKyBiTuChoi`           | `dangky.rejected`       | Khoa                | Lịch, Huy, Khang |
| EV-09 | `DangKyDaHuy`              | `dangky.cancelled`      | Khoa                | Huy, Khang       |
| EV-10 | `TrangThaiTaiKhoanThayDoi` | `taikhoan.status`       | Khoa (Auth)         | Lịch             |
| EV-11 | `ThaoTacQuanTrong`         | `audit.action`          | Mọi dịch vụ         | Lịch             |
| EV-12 | `DeTaiCanKiemTraTrung`     | `detai.check_requested` | Khang               | Khoa (AI)        |
| EV-13 | `KetQuaKiemTraTrung`       | `detai.check_result`    | Khoa (AI)           | Khang, Lịch      |
| EV-14 | `DotDeTaiThayDoi`          | `dot.changed`           | Khang               | Lịch             |
| EV-15 | `HoiDongDuocLap`           | `hoidong.formed`        | Khương (hội đồng)   | Lịch, Huy        |
| EV-16 | `KetQuaNghiemThu`          | `nghiemthu.result`      | Khương (hội đồng)   | Lịch, Huy        |
| EV-17 | `HoSoDuocNop`              | `hoso.submitted`        | Khang               | Lịch             |

Hàng đợi và khóa liên kết:

| Hàng đợi         | Bên nhận | Khóa liên kết                                                                                                                                                                                                                                |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `q.notification` | Lịch     | `detai.proposed`, `detai.approved`, `detai.rejected`, `dangky.created`, `dangky.approved`, `dangky.rejected`, `taikhoan.status`, `audit.action`, `detai.check_result`, `dot.changed`, `hoidong.formed`, `nghiemthu.result`, `hoso.submitted` |
| `q.report`       | Huy      | `sinhvien.changed`, `detai.proposed`, `detai.approved`, `detai.updated`, `dangky.created`, `dangky.approved`, `dangky.rejected`, `dangky.cancelled`, `hoidong.formed`, `nghiemthu.result`                                                    |
| `q.topic`        | Khang    | `dangky.created`, `dangky.approved`, `dangky.rejected`, `dangky.cancelled`, `detai.check_result`                                                                                                                                             |
| `q.ai`           | Khoa     | `detai.check_requested`                                                                                                                                                                                                                      |

---

## 6. Việc cần hỏi cán bộ Khoa hoặc giảng viên hướng dẫn

Chưa chốt, làm bằng giá trị đề xuất trong SRS và dễ đổi (đặt trong `.env`):

- OI-05: GPA thang 4, mỗi sinh viên một đề tài, chỉ tiêu theo đề tài.
- OI-08: quy định giờ NCKH (P-22), tiêu chí và trọng số chấm (P-19), điểm đạt (P-20), số đề tài tối đa của giảng viên (P-14).
- OI-09: nguồn dữ liệu sinh viên, giảng viên, đề tài cũ. Trong phạm vi học phần dùng dữ liệu mẫu và nhập từ tệp (FR-05).

## 7. Nếu thiếu thời gian, cắt theo thứ tự này

Giữ trước: ưu tiên **Cao** trong SRS (Auth và phân quyền, Academic, Topic lõi, Registration, kiểm tra trùng bằng AI). Cắt sau cùng: xuất báo cáo (FR-19), quy đổi giờ NCKH (FR-31), nhập từ tệp (FR-05), gợi ý hội đồng bằng AI (FR-33), nhắc hạn (FR-30), email thật, Docker Compose, mô hình ngôn ngữ ngoài (luôn có đường lui là nhận xét theo mẫu).
