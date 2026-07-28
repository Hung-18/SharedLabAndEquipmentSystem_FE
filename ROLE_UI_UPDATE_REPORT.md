# BÁO CÁO CHỈNH SỬA FRONTEND THEO PHÂN QUYỀN

## Shared Lab & Equipment Booking System

## 1. Yêu cầu đã thực hiện

### Admin

- Đã ẩn **Quick Booking**.
- Đã ẩn **My Bookings**.
- Đã ẩn **My Waitlists**.
- Đã ẩn **Violations & penalty points** cá nhân.
- Đã bỏ toàn bộ nhóm **Management** khỏi sidebar Admin.
- Đã thay **Maintenance Calendar** trong Resources bằng **System Maintenance**.
- Đã chuyển **Reports** sang nhóm System Administration để Admin vẫn xem được báo cáo theo đề bài.
- Admin vẫn có: Dashboard, Resource Calendar, Labs, Equipment, System Maintenance, Notifications, Profile, Users, Departments, Priority Rules, Reports, Send Notification, Audit Logs và Roles.

### Lab Manager

- Đã ẩn **Quick Booking**.
- Đã ẩn **My Bookings**.
- Đã ẩn **My Waitlists**.
- Đã ẩn **Violations & penalty points** cá nhân.
- Giữ nhóm **Management** cho nghiệp vụ duyệt booking, bảo trì, usage log, sự cố, waitlist, violation và reports.
- Đã thêm **Send Notification** vào nhóm Management.
- Các nút tạo booking cá nhân đã được ẩn khỏi Calendar, Lab Detail, Equipment Detail, danh sách Lab và danh sách Equipment.

### Requester

- Giữ nguyên Quick Booking.
- Giữ My Bookings, My Waitlists và Violations & penalty points.
- Giữ chức năng tạo/sửa booking cá nhân.
- Không hiển thị nghiệp vụ quản lý của Lab Manager hoặc quản trị của Admin.

## 2. Route và guard đã cập nhật

- `/app/bookings/new`: chỉ Requester.
- `/app/bookings/my`: chỉ Requester.
- `/app/bookings/:bookingId/edit`: chỉ Requester.
- `/app/waitlists/my`: chỉ Requester.
- `/app/violations/my`: chỉ Requester.
- Các route nghiệp vụ Management: chỉ LabManager.
- `/app/reports`: Admin và LabManager.
- `/app/notifications/send`: Admin và LabManager.
- `/app/admin/system-maintenance`: chỉ Admin.
- Route cũ `/app/admin/notifications/send` được giữ dưới dạng redirect để tránh hỏng bookmark cũ.

## 3. Màn hình System Maintenance mới

Route: `/app/admin/system-maintenance`

Giao diện gồm:

- Nút bật/tắt Maintenance Mode.
- Thời gian bắt đầu dự kiến.
- Thời gian kết thúc dự kiến.
- Nội dung thông báo hiển thị cho người dùng.
- Khối xem trước thông báo.
- Banner cảnh báo toàn giao diện khi Maintenance Mode được bật.
- Hỗ trợ tiếng Việt và tiếng Anh.
- Lưu trạng thái bằng localStorage và đồng bộ giữa các tab cùng trình duyệt qua sự kiện storage.

## 4. Giới hạn backend cần lưu ý

### 4.1. Lab Manager gửi thông báo

Frontend đã mở route và menu cho LabManager. Tuy nhiên backend hiện đang có:

```csharp
[Authorize(Roles = "Admin")]
[HttpPost("send")]
```

Để LabManager gửi thông báo thật, backend cần đổi thành:

```csharp
[Authorize(Roles = "Admin,LabManager")]
[HttpPost("send")]
```

Nếu chưa sửa backend, LabManager sẽ nhìn thấy màn hình nhưng request gửi thông báo trả `403 Forbidden`.

### 4.2. System Maintenance toàn hệ thống

Backend hiện chưa có API lưu Maintenance Mode. Vì vậy frontend đang lưu cấu hình trên trình duyệt và hiển thị banner trong giao diện hiện tại.

Muốn trạng thái Maintenance Mode đồng bộ trên tất cả thiết bị và thực sự khóa truy cập, backend cần bổ sung API/config dùng chung, ví dụ:

- `GET /api/SystemSettings/maintenance`
- `PUT /api/SystemSettings/maintenance`

## 5. Kiểm tra kỹ thuật

- TypeScript `tsc --noEmit`: PASS.
- Angular template compiler `ngc --noEmit`: PASS.
- JSON bản dịch VI/EN: hợp lệ.
- Route tới component mới: hợp lệ.
- Các link tạo booking không đúng vai trò đã được ẩn.
- Source đã được format bằng Prettier.
- Không đóng gói `node_modules`, `dist`, `.angular` hoặc cache.

## 6. Cách chạy

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Mở:

```text
http://localhost:4200
```
