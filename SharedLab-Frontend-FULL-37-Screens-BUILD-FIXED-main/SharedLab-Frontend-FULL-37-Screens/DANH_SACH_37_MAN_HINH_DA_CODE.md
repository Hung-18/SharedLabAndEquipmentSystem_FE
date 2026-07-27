# DANH SÁCH 37 MÀN HÌNH ĐÃ CODE

## A. Chưa đăng nhập và hệ thống

| Mã | Màn hình | Route | API/chức năng chính |
|---|---|---|---|
| MH-01 | Đăng nhập | `/login` | `POST /api/Auth/login`, `GET /api/Auth/me`, lưu token và phân luồng role |
| MH-02 | Quên mật khẩu | `/forgot-password` | `POST /api/Auth/forgot-password` |
| MH-03 | Đặt lại mật khẩu | `/reset-password` | `POST /api/Auth/reset-password` |
| MH-04 | Không có quyền | `/403` | Route guard và xử lý HTTP 403 |
| MH-05 | Không tìm thấy trang | Route không tồn tại | Wildcard route, quay lại hoặc về trang chủ theo role |

## B. Màn hình dùng chung

| Mã | Màn hình | Route | API/chức năng chính |
|---|---|---|---|
| MH-06 | Trang chủ Requester | `/app/home` | Ghép booking, waitlist, notification, violation và `/Auth/me` |
| MH-07 | Dashboard Admin/LabManager | `/app/dashboard` | `GET /api/Dashboard?from=&to=` |
| MH-08 | Tài khoản cá nhân | `/app/profile` | `GET /api/Auth/me`, chế độ chỉ xem đúng giới hạn backend |
| MH-09 | Trung tâm thông báo | `/app/notifications` | Danh sách, unread, unread-count, read, read-all |
| MH-10 | Lịch tài nguyên | `/app/calendar` | `GET /api/Bookings/calendar`, lọc lab/equipment/event, lịch tháng và list |
| MH-11 | Danh sách phòng lab | `/app/labs` | Get/search/create; modal tạo chỉ Admin |
| MH-12 | Chi tiết phòng lab | `/app/labs/:labId` | Detail, thiết bị, calendar, maintenance; sửa/đổi manager/xóa chỉ Admin |
| MH-13 | Danh sách thiết bị | `/app/equipments` | Get/search/create; modal tạo chỉ Admin |
| MH-14 | Chi tiết thiết bị | `/app/equipments/:equipmentId` | Detail, lab, calendar, maintenance; sửa/xóa chỉ Admin |

## C. Requester và luồng cá nhân

| Mã | Màn hình | Route | API/chức năng chính |
|---|---|---|---|
| MH-15 | Tạo booking | `/app/bookings/new` | Wizard 4 bước, priority active, calendar, suggested-slots, create booking, join waitlist |
| MH-16 | Booking của tôi | `/app/bookings/my` | `GET /api/Bookings/user/{userId}`, tab trạng thái và lọc client-side |
| MH-17 | Chi tiết booking | `/app/bookings/:bookingId` | Detail, usage log, violation, approve/reject/cancel/complete/no-show, check-in/out, incident |
| MH-18 | Hàng chờ của tôi | `/app/waitlists/my` | Danh sách, countdown Notified, cancel, tạo booking và mark booked |
| MH-19 | Vi phạm và điểm phạt | `/app/violations/my` | Violation list, active và summary |

## D. Admin và LabManager

| Mã | Màn hình | Route | API/chức năng chính |
|---|---|---|---|
| MH-20 | Quản lý toàn bộ booking | `/app/management/bookings` | `GET /api/Bookings`, lọc và thao tác nghiệp vụ |
| MH-21 | Booking cần duyệt | `/app/management/bookings/pending` | `GET /api/Bookings/pending`, sort priority/createdAt, approve/reject |
| MH-22 | Quản lý/lịch bảo trì | `/app/management/maintenances` | Get all, filter, table/card; Requester chỉ xem, quản lý mới thấy nút tạo |
| MH-23 | Tạo/sửa bảo trì | `/app/management/maintenances/new`, `/:id/edit` | Create/update, recurrence, query prefill tài nguyên |
| MH-24 | Chi tiết bảo trì | `/app/management/maintenances/:id` | Detail, start, complete, cancel, cancel-series; action theo role/trạng thái |
| MH-25 | Nhật ký sử dụng | `/app/management/usage-logs` | Usage log list/detail, checkout, incident |
| MH-26 | Duyệt sự cố | `/app/management/incidents` | Incident query, confirm/reject và review note |
| MH-27 | Quản lý hàng chờ | `/app/management/waitlists` | Get all/queue, notify-next, expire, cancel |
| MH-28 | Quản lý vi phạm | `/app/management/violations` | Get/create/resolve/cancel, link booking và user |
| MH-29 | Trung tâm báo cáo | `/app/reports` | 15 endpoint report, 8 nhóm nội dung, KPI, chart và bảng |

## E. Admin

| Mã | Màn hình | Route | API/chức năng chính |
|---|---|---|---|
| MH-30 | Danh sách người dùng | `/app/admin/users` | Search/pagination theo keyword, role, department, status |
| MH-31 | Tạo người dùng | `/app/admin/users/new` | `POST /api/Auth/create-user`, department và role thật |
| MH-32 | Chi tiết/chỉnh sửa người dùng | `/app/admin/users/:userId` | Update profile, role, department, status, lock/unlock, active/inactive, penalty và violation |
| MH-33 | Khoa/phòng ban | `/app/admin/departments` | Get/create/update/deactivate/activate bằng modal |
| MH-34 | Quy tắc ưu tiên | `/app/admin/priority-rules` | Get/create/update/activate/deactivate |
| MH-35 | Gửi thông báo | `/app/admin/notifications/send` | `POST /api/Notifications/send`, tìm và chọn một người nhận |
| MH-36 | Audit log | `/app/admin/audit-logs` | Search/pagination/filter và drawer OldValue/NewValue format JSON |
| MH-37 | Danh sách vai trò | `/app/admin/roles` | `GET /api/Roles`, read-only đúng backend |

## Thành phần dùng chung đã có

- Sidebar/menu tự thay đổi theo Requester, LabManager và Admin.
- Auth guard, guest guard, landing guard và role guard.
- HTTP interceptor gắn JWT, refresh token và xử lý 401/403.
- Loading skeleton, empty state, toast, modal, drawer và xác nhận thao tác.
- Badge trạng thái chuẩn hóa tiếng Việt theo từng domain.
- Chuyển thời gian local sang ISO/UTC trước khi gửi backend.
- Angular proxy `/api` sang backend HTTPS để tránh CORS preflight redirect.
