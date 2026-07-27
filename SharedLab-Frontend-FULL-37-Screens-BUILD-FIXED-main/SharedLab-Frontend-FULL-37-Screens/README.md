# Shared Lab & Equipment Booking System — Full Frontend

Frontend Angular hoàn chỉnh cho backend **SharedLabAndEquipmentBookingSystem(22)**. Project được mở rộng trực tiếp từ cây thư mục `angular-base-starter-main`, giữ nguyên kiến trúc standalone component và bổ sung đầy đủ **37 màn hình nghiệp vụ** theo ba vai trò Requester, LabManager và Admin.

## Điểm nổi bật

- 37 màn hình chính, đầy đủ route, menu và route guard theo vai trò.
- Gọi API thật của backend cho đăng nhập, tài nguyên, booking, bảo trì, usage log, waitlist, violation, report, user management và audit log.
- JWT access token, refresh token tự động, ghi nhớ đăng nhập bằng `localStorage` hoặc phiên tab bằng `sessionStorage`.
- Angular dev proxy `/api` sang `https://localhost:7073`, tránh lỗi CORS do backend redirect HTTP sang HTTPS.
- Giao diện responsive, sidebar theo role, dashboard, lịch tháng, wizard booking, bảng, card, modal, drawer, toast, loading skeleton, empty state và error state.
- Không thêm nút gọi API không tồn tại. Các giới hạn của backend được thể hiện đúng trên giao diện.
- Không dùng thư viện biểu đồ ngoài; dashboard và report dùng CSS/SVG để giảm dependency.

## Công nghệ

- Angular 22 standalone components
- Angular Signals
- TypeScript 6
- Tailwind CSS 4
- RxJS 7
- Angular Router, HTTP interceptors và route guards

## Yêu cầu môi trường

Dùng một trong các phiên bản Node phù hợp với `package.json`:

```text
Node ^22.22.3 hoặc ^24.15.0 hoặc >=26
npm >=10
```

Project có sẵn `.nvmrc`:

```bash
nvm use
```

## Chạy backend

Chạy backend bằng profile **https**. Theo `launchSettings.json` của backend đã gửi:

```text
Swagger: https://localhost:7073/swagger
HTTP:    http://localhost:5253
HTTPS:   https://localhost:7073
```

Backend phải chạy thành công, kết nối được SQL Server và có cấu hình JWT trước khi test frontend.

## Chạy frontend

Mở terminal tại thư mục chứa `package.json`:

```bash
npm ci
npm start
```

Mở:

```text
http://localhost:4200
```

Frontend gọi `/api/...`; Angular dev server tự chuyển tiếp sang `https://localhost:7073/api/...` theo `proxy.conf.json`.

## Cấu hình cổng backend

Mặc định:

```json
{
  "/api": {
    "target": "https://localhost:7073",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

Nếu backend chạy cổng khác, sửa duy nhất `target` trong `proxy.conf.json`, sau đó khởi động lại `npm start`.

## Luồng xác thực

1. `POST /api/Auth/login`.
2. Lưu access token và refresh token.
3. `GET /api/Auth/me` để lấy user, role và trạng thái.
4. Requester chuyển tới `/app/home`.
5. Admin/LabManager chuyển tới `/app/dashboard`.
6. Interceptor gắn `Authorization: Bearer ...` cho request sau đăng nhập.
7. Khi access token hết hạn, frontend gọi `POST /api/Auth/refresh` và gửi lại request cũ.
8. API trả 403 thì chuyển `/403`; refresh thất bại thì xóa phiên và về `/login`.

## Cấu trúc chính

```text
src/app/
├── core/
│   ├── api/             # Models và service gọi toàn bộ API
│   ├── auth/            # Auth service, store, token storage, guards
│   ├── config/          # Environment mapping
│   └── http/            # JWT và error/refresh interceptors
├── features/
│   ├── admin/           # User, department, priority, notification, audit, role
│   ├── auth/            # Login, forgot password, reset password
│   ├── bookings/        # Booking wizard, danh sách cá nhân, chi tiết
│   ├── dashboard/       # Dashboard Admin/LabManager
│   ├── home/            # Requester home
│   ├── management/      # Booking, maintenance, usage, incident, waitlist, violation
│   ├── notifications/   # Trung tâm thông báo
│   ├── profile/         # Hồ sơ chỉ xem
│   ├── reports/         # Trung tâm báo cáo nhiều tab
│   ├── requester/       # Waitlist và violation cá nhân
│   ├── resources/       # Calendar, lab, equipment
│   └── system/          # 403, 404
└── shared/
    ├── layout/          # Sidebar/header responsive theo role
    ├── ui/              # Icon, modal, status badge, toast, data state
    └── utils/           # Nhãn enum, thời gian, tiền tệ
```

## Tài liệu đi kèm

- `TAI_LIEU_YEU_CAU_37_MAN_HINH.md`: tài liệu yêu cầu màn hình gốc được đặt kèm để đối chiếu.
- `DANH_SACH_37_MAN_HINH_DA_CODE.md`: mapping đầy đủ MH-01 đến MH-37, route, role và API.
- `HUONG_DAN_CHAY_VA_TEST.md`: quy trình chạy và test theo module.
- `LOI_CORS_DA_SUA.md`: giải thích cấu hình proxy và lỗi preflight.
- `KIEM_TRA_KY_THUAT.md`: các bước kiểm tra đã thực hiện trước khi đóng gói.

## Build production

```bash
npm run build
```

Output mặc định nằm trong `dist/`. Khi deploy production, web server cần proxy `/api` tới backend và fallback mọi route Angular về `index.html`.
