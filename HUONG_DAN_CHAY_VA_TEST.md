# HƯỚNG DẪN CHẠY VÀ TEST FULL FRONTEND

## 1. Chuẩn bị

1. Chạy SQL Server và đảm bảo backend kết nối database thành công.
2. Chạy backend bằng profile **https**.
3. Mở được `https://localhost:7073/swagger`.
4. Database nên có ít nhất một tài khoản Admin, LabManager và Requester; có phòng lab, thiết bị và priority rule Active.
5. Cài Node theo `.nvmrc` hoặc phiên bản được khai báo trong `package.json`.

## 2. Khởi động frontend

```bash
npm ci
npm start
```

Mở `http://localhost:4200`.

Trong DevTools > Network, request sẽ có dạng:

```text
http://localhost:4200/api/Auth/login
```

Angular proxy tự chuyển tiếp tới:

```text
https://localhost:7073/api/Auth/login
```

## 3. Test xác thực

### Đăng nhập

1. Mở `/login`.
2. Đăng nhập lần lượt bằng Requester, LabManager và Admin.
3. Kiểm tra request `POST /api/Auth/login`, tiếp theo `GET /api/Auth/me`.
4. Requester phải vào `/app/home`; Admin/LabManager vào `/app/dashboard`.
5. Thử sai mật khẩu, hiện/ẩn mật khẩu và checkbox ghi nhớ đăng nhập.

### Refresh token

1. Đăng nhập thành công.
2. Thay access token trong Storage bằng token sai nhưng giữ refresh token.
3. Gọi một màn hình có API.
4. Kiểm tra frontend gọi `/api/Auth/refresh`, lưu token mới và gửi lại request cũ.

### Phân quyền

- Requester mở `/app/admin/users` phải về `/403`.
- Requester mở `/app/management/bookings` phải về `/403`.
- LabManager mở `/app/admin/departments` phải về `/403`.
- API trả 403 cũng phải chuyển tới `/403`.

## 4. Test tài nguyên

### Phòng lab

- `/app/labs`: tìm kiếm, status, manager, sức chứa, phân trang.
- Admin: mở modal tạo phòng và kiểm tra `POST /api/LabRooms`.
- `/app/labs/:id`: detail, thiết bị, lịch, bảo trì.
- Admin: sửa, đổi manager và ngừng sử dụng.
- Admin/LabManager: nút tạo bảo trì phải prefill đúng lab.

### Thiết bị

- `/app/equipments`: tìm kiếm, lab, status, phân trang.
- Admin: tạo thiết bị.
- `/app/equipments/:id`: detail, phòng chứa, lịch và bảo trì.
- Admin: sửa hoặc ngừng sử dụng.
- Admin/LabManager: nút tạo bảo trì phải prefill đúng equipment.

### Calendar

- `/app/calendar`: đổi tháng, lọc lab, equipment, Booking/Maintenance.
- Test view tháng và view danh sách.
- Click sự kiện phải mở đúng booking hoặc maintenance.
- Mở từ trang lab/equipment phải nhận query filter tương ứng.

## 5. Test booking và waitlist

### Tạo booking

1. Mở `/app/bookings/new`.
2. Chọn đặt cả phòng hoặc một/nhiều thiết bị cùng phòng.
3. Chọn thời gian tương lai.
4. Bấm kiểm tra lịch.
5. Nếu xung đột, kiểm tra suggested slots.
6. Với đúng một tài nguyên, kiểm tra nút Tham gia hàng chờ.
7. Chọn purpose, nhập mô tả và gửi booking.
8. Kiểm tra `POST /api/Bookings` và route chi tiết sau khi tạo.
9. Tài khoản Restricted/Inactive/Locked phải bị vô hiệu hóa nút gửi.

### Booking cá nhân và chi tiết

- `/app/bookings/my`: tab trạng thái, tìm kiếm, mở detail.
- `/app/bookings/:id`: kiểm tra tài nguyên, usage log và violation.
- Chủ booking: cancel, check-in/check-out và báo sự cố theo trạng thái.
- Admin/LabManager: approve, reject, cancel, complete, no-show.
- Khi approve gặp 409, UI phải hiện lỗi xung đột rõ ràng.

### Waitlist

- `/app/waitlists/my`: tab trạng thái và countdown 30 phút cho Notified.
- Cancel bản ghi Waiting/Notified.
- Bấm Tạo booking ngay: form phải prefill tài nguyên, thời gian và sau khi tạo gọi mark booked.
- `/app/management/waitlists`: test notify-next, expire và cancel.

## 6. Test bảo trì và sử dụng

### Maintenance

- `/app/management/maintenances`: filter và view table/card.
- Requester chỉ xem, không thấy nút tạo hoặc action thay đổi trạng thái.
- Admin/LabManager tạo maintenance đơn lẻ hoặc định kỳ.
- Detail: Scheduled có sửa/start/cancel; InProgress có complete/cancel; Completed/Cancelled chỉ xem.
- Test cancel một kỳ và cancel-series.

### Usage log và incident

- `/app/management/usage-logs`: mở log, checkout và báo sự cố.
- `/app/management/incidents`: filter thời gian/trạng thái, confirm hoặc reject kèm ghi chú.
- Kiểm tra incident được xác nhận có thể tác động violation theo nghiệp vụ backend.

## 7. Test vi phạm

- `/app/violations/my`: summary, active violation, điểm phạt và restrictionUntil.
- `/app/management/violations`: tạo thủ công, resolve và cancel.
- Kiểm tra LabManager chỉ nhận dữ liệu trong scope backend.

## 8. Test dashboard và báo cáo

### Dashboard

- `/app/dashboard` với preset 7 ngày, 30 ngày, tháng và quý.
- Kiểm tra KPI, chart booking, purpose, department, resource utilization, most-used, penalty users và usage trend.
- LabManager chỉ thấy dữ liệu các phòng được quản lý.

### Reports

- `/app/reports`: chuyển qua các nhóm Tổng quan, tài nguyên, khoa/phòng ban, top tài nguyên, bảo trì, lịch sử, vi phạm và xu hướng.
- Thay đổi from/to, top N và groupBy.
- Mở Network để kiểm tra các endpoint `/api/Reports/...`.

## 9. Test Admin

### User

- `/app/admin/users`: keyword, roleName, department, status và phân trang.
- `/app/admin/users/new`: tạo user với role và department thật.
- `/app/admin/users/:id`: sửa profile, role, department, status, lock/unlock, activate/deactivate.
- Frontend không cho Admin tự đổi role hoặc vô hiệu hóa chính mình.

### Department, priority, notification, audit và role

- `/app/admin/departments`: create/update/deactivate/activate.
- `/app/admin/priority-rules`: create/update/activate/deactivate; số nhỏ ưu tiên cao.
- `/app/admin/notifications/send`: tìm user, xem preview và gửi một người nhận.
- `/app/admin/audit-logs`: filter, pagination và drawer JSON old/new.
- `/app/admin/roles`: danh sách read-only.

## 10. Khi gặp lỗi

### CORS/preflight redirect

- Không đổi frontend về `http://localhost:5253/api`.
- Chạy backend bằng profile https và giữ `apiBaseUrl: '/api'`.
- Kiểm tra `proxy.conf.json` target là `https://localhost:7073`.
- Sau khi sửa proxy phải dừng và chạy lại `npm start`.

### 401

- Kiểm tra login trả `accessToken` và `refreshToken`.
- Kiểm tra request có header `Authorization: Bearer ...`.
- Kiểm tra JWT issuer, audience và key ở backend.
- Xóa Local Storage/Session Storage rồi đăng nhập lại nếu token cũ.

### 409

Đây thường là xung đột booking/maintenance hoặc thay đổi dữ liệu đồng thời. Đọc message backend trong toast, tải lại dữ liệu rồi thử lại.
