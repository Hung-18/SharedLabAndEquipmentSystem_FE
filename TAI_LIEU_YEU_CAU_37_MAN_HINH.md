# DANH SÁCH MÀN HÌNH FRONTEND NÊN CÓ

## Shared Lab & Equipment Booking System

> Tài liệu này được lập trực tiếp từ backend trong file `SharedLabAndEquipmentBookingSystem(22).zip`.
>
> Mục tiêu của tài liệu là giúp thiết kế frontend đầy đủ trước khi code. Danh sách bên dưới không yêu cầu mỗi chức năng phải là một trang riêng. Những thao tác nhỏ nên dùng modal, drawer hoặc tab để giao diện gọn hơn.

---

# 1. Tổng quan hệ thống

Hệ thống có 3 vai trò:

| Vai trò | Phạm vi chính |
|---|---|
| **Requester** | Xem phòng và thiết bị, xem lịch, tạo booking, theo dõi booking, tham gia hàng chờ, check-in/check-out, báo sự cố, xem vi phạm và thông báo của mình. |
| **LabManager** | Quản lý nghiệp vụ tại các phòng được phân công: duyệt booking, bảo trì, hàng chờ, nhật ký sử dụng, sự cố, vi phạm, dashboard và báo cáo. |
| **Admin** | Có toàn quyền nghiệp vụ, đồng thời quản lý người dùng, khoa/phòng ban, phòng lab, thiết bị, quy tắc ưu tiên, thông báo hệ thống, vai trò và audit log. |

Backend hiện có các nhóm chức năng chính:

1. Xác thực và khôi phục mật khẩu.
2. Người dùng, vai trò và khoa/phòng ban.
3. Phòng lab và thiết bị.
4. Booking và lịch tài nguyên.
5. Đề xuất khung giờ thay thế.
6. Hàng chờ.
7. Bảo trì và bảo trì định kỳ.
8. Check-in, check-out và nhật ký sử dụng.
9. Báo cáo sự cố và xét duyệt sự cố.
10. Vi phạm và điểm phạt.
11. Quy tắc ưu tiên booking.
12. Thông báo.
13. Dashboard và báo cáo.
14. Audit log.

---

# 2. Số lượng màn hình đề xuất

Nên có khoảng **37 màn hình chính**. Một số màn hình dùng chung cho nhiều vai trò nhưng hiển thị nút thao tác khác nhau theo quyền.

| Nhóm | Số màn hình |
|---|---:|
| Chưa đăng nhập và trang hệ thống | 5 |
| Màn hình dùng chung sau đăng nhập | 9 |
| Màn hình dành cho Requester | 5 |
| Màn hình nghiệp vụ cho Admin và LabManager | 10 |
| Màn hình quản trị riêng của Admin | 8 |
| **Tổng cộng** | **37** |

---

# 3. Menu đề xuất theo vai trò

## 3.1. Menu Requester

1. Trang chủ.
2. Lịch tài nguyên.
3. Phòng lab.
4. Thiết bị.
5. Tạo booking.
6. Booking của tôi.
7. Hàng chờ của tôi.
8. Vi phạm và điểm phạt.
9. Thông báo.
10. Tài khoản cá nhân.

## 3.2. Menu LabManager

1. Dashboard.
2. Lịch tài nguyên.
3. Phòng lab.
4. Thiết bị.
5. Booking cần duyệt.
6. Quản lý booking.
7. Bảo trì.
8. Nhật ký sử dụng.
9. Duyệt sự cố.
10. Hàng chờ.
11. Vi phạm.
12. Báo cáo.
13. Thông báo.
14. Tài khoản cá nhân.

LabManager chỉ được thao tác với tài nguyên thuộc phòng mình quản lý. Backend đã có kiểm tra phạm vi này, frontend cũng nên ẩn các nút không thuộc quyền.

## 3.3. Menu Admin

1. Dashboard.
2. Lịch tài nguyên.
3. Phòng lab.
4. Thiết bị.
5. Quản lý booking.
6. Booking cần duyệt.
7. Bảo trì.
8. Nhật ký sử dụng.
9. Duyệt sự cố.
10. Hàng chờ.
11. Vi phạm.
12. Báo cáo.
13. Người dùng.
14. Khoa/phòng ban.
15. Quy tắc ưu tiên.
16. Gửi thông báo.
17. Audit log.
18. Danh sách vai trò.
19. Thông báo cá nhân.
20. Tài khoản cá nhân.

---

# 4. Chi tiết từng màn hình

# A. Màn hình chưa đăng nhập và màn hình hệ thống

## MH-01. Đăng nhập

**Route đề xuất:** `/login`

**Người sử dụng:** Tất cả người dùng chưa đăng nhập.

**Thành phần chính:**

- Logo và tên hệ thống.
- Ô Email.
- Ô Mật khẩu.
- Nút hiện/ẩn mật khẩu.
- Checkbox ghi nhớ đăng nhập ở frontend nếu cần.
- Nút Đăng nhập.
- Link Quên mật khẩu.
- Khu vực hiển thị lỗi đăng nhập.

**Luồng xử lý:**

1. Gọi `POST /api/Auth/login`.
2. Lưu access token và refresh token theo cách an toàn.
3. Gọi `GET /api/Auth/me` để lấy vai trò và thông tin người dùng.
4. Điều hướng tới dashboard tương ứng với vai trò.

**Lưu ý:**

- Không có chức năng tự đăng ký tài khoản.
- Tài khoản do Admin tạo.
- Khi access token hết hạn, frontend dùng `POST /api/Auth/refresh`.

---

## MH-02. Quên mật khẩu

**Route đề xuất:** `/forgot-password`

**Thành phần chính:**

- Ô Email.
- Nút Gửi liên kết đặt lại mật khẩu.
- Nút quay lại đăng nhập.
- Thông báo chung sau khi gửi, không tiết lộ email có tồn tại hay không.

**API:** `POST /api/Auth/forgot-password`.

---

## MH-03. Đặt lại mật khẩu

**Route đề xuất:** `/reset-password`

**Dữ liệu đầu vào:**

- Email.
- Token lấy từ đường dẫn trong email.
- Mật khẩu mới.
- Nhập lại mật khẩu mới.

**Thao tác:**

- Xác nhận đặt lại mật khẩu.
- Quay lại trang đăng nhập sau khi thành công.

**API:** `POST /api/Auth/reset-password`.

---

## MH-04. Không có quyền truy cập

**Route đề xuất:** `/403`

**Hiển thị:**

- Thông báo người dùng không có quyền truy cập.
- Nút quay về trang chủ theo vai trò.
- Không hiển thị chi tiết kỹ thuật của lỗi.

Frontend chuyển tới trang này khi API trả về 403 hoặc người dùng mở route không thuộc vai trò.

---

## MH-05. Không tìm thấy trang

**Route đề xuất:** `/404`

**Hiển thị:**

- Thông báo không tìm thấy nội dung.
- Nút trở về trang chủ.
- Nút trở lại trang trước.

---

# B. Màn hình dùng chung sau khi đăng nhập

## MH-06. Trang chủ Requester

**Route đề xuất:** `/app/home`

Backend chưa có API dashboard riêng cho Requester. Frontend có thể ghép dữ liệu từ nhiều API.

**Các thẻ tổng quan nên có:**

- Số booking đang chờ duyệt.
- Số booking sắp diễn ra.
- Số lượt hàng chờ đang hoạt động.
- Số thông báo chưa đọc.
- Tổng điểm phạt.
- Trạng thái tài khoản: Active, Restricted, Inactive hoặc Locked.
- Thời gian hết hạn hạn chế nếu đang Restricted.

**Các khối nội dung:**

1. Booking sắp tới.
2. Booking gần đây.
3. Thông báo mới nhất.
4. Hàng chờ vừa được thông báo.
5. Cảnh báo vi phạm hoặc hạn chế tài khoản.
6. Nút Tạo booking nhanh.
7. Nút Xem lịch tài nguyên.

**API có thể dùng:**

- `GET /api/Auth/me`.
- `GET /api/Bookings/user/{userId}`.
- `GET /api/Waitlists/user/{userId}`.
- `GET /api/Notifications/user/{userId}/unread-count`.
- `GET /api/Notifications/user/{userId}`.
- `GET /api/Violations/user/{userId}/summary`.

---

## MH-07. Dashboard Admin/LabManager

**Route đề xuất:** `/app/dashboard`

**Quyền:** Admin và LabManager.

**Bộ lọc:**

- Từ ngày.
- Đến ngày.
- Các lựa chọn nhanh: 7 ngày, 30 ngày, tháng này, quý này.

**Các thẻ chỉ số:**

- Tổng booking.
- Tổng usage log.
- Tổng vi phạm.
- Tổng chi phí bảo trì.
- Số NoShow.
- Tỷ lệ NoShow.

**Biểu đồ và bảng:**

1. Booking theo trạng thái.
2. Booking theo mục đích.
3. Booking theo khoa/phòng ban.
4. Tỷ lệ sử dụng phòng lab.
5. Tỷ lệ sử dụng thiết bị.
6. Tỷ lệ sử dụng theo khoa/phòng ban.
7. Phòng lab được dùng nhiều nhất.
8. Thiết bị được dùng nhiều nhất.
9. Người dùng có nhiều điểm phạt nhất.
10. Xu hướng sử dụng theo thời gian.

**API:** `GET /api/Dashboard?from=...&to=...`.

**Lưu ý:** LabManager chỉ thấy dữ liệu thuộc các phòng mình quản lý.

---

## MH-08. Tài khoản cá nhân

**Route đề xuất:** `/app/profile`

**Thông tin hiển thị:**

- Họ tên.
- Username.
- Email.
- Vai trò.
- Khoa/phòng ban.
- Điểm phạt.
- Trạng thái tài khoản.
- Thời gian hết hạn hạn chế.

**API:** `GET /api/Auth/me`.

**Giới hạn backend hiện tại:**

- Chưa có API cho người dùng tự sửa hồ sơ.
- Chưa có API đổi mật khẩu khi đang đăng nhập.
- Vì vậy màn hình này nên để chế độ chỉ xem.
- Có thể đặt nút “Quên/đặt lại mật khẩu” dẫn về luồng reset qua email.

---

## MH-09. Trung tâm thông báo

**Route đề xuất:** `/app/notifications`

**Thành phần:**

- Danh sách thông báo có phân trang.
- Tab Tất cả.
- Tab Chưa đọc.
- Số thông báo chưa đọc.
- Bộ lọc loại thông báo.
- Nút Đánh dấu đã đọc cho từng thông báo.
- Nút Đánh dấu tất cả đã đọc.

**Loại thông báo:**

- Booking được duyệt.
- Booking bị từ chối.
- Nhắc lịch booking.
- Có chỗ trống từ hàng chờ.
- Bảo trì.
- Vi phạm.
- Thông báo hệ thống.

**API:**

- `GET /api/Notifications/user/{userId}`.
- `GET /api/Notifications/user/{userId}/unread`.
- `GET /api/Notifications/user/{userId}/unread-count`.
- `POST /api/Notifications/{id}/read`.
- `POST /api/Notifications/user/{userId}/read-all`.

**Tương tác nên có:**

- Click thông báo booking để mở chi tiết booking.
- Click thông báo vi phạm để mở trang vi phạm.
- Click thông báo hàng chờ để mở bản ghi hàng chờ và hiển thị thời gian còn lại.

---

## MH-10. Lịch tài nguyên dùng chung

**Route đề xuất:** `/app/calendar`

**Người sử dụng:** Tất cả người dùng đã đăng nhập.

**Chế độ xem:**

- Theo tháng.
- Theo tuần.
- Theo ngày.
- Dạng timeline theo phòng hoặc thiết bị nếu frontend có thời gian làm.

**Bộ lọc:**

- Khoảng ngày.
- Phòng lab.
- Thiết bị.
- Loại sự kiện: Booking hoặc Maintenance.
- Trạng thái.
- Chỉ hiển thị sự kiện đang chặn tài nguyên.

**Thông tin sự kiện:**

- Tiêu đề.
- Loại sự kiện.
- Thời gian bắt đầu và kết thúc.
- Trạng thái.
- Tài nguyên liên quan.
- Có đang chặn tài nguyên hay không.

**API:** `GET /api/Bookings/calendar?from=...&to=...&labId=...&equipmentId=...`.

**Thao tác:**

- Click sự kiện booking để mở chi tiết booking nếu có quyền.
- Click maintenance để mở chi tiết bảo trì.
- Requester có nút Tạo booking tại khung giờ đang chọn.
- Admin/LabManager có nút Tạo lịch bảo trì.

**Màu trạng thái nên thống nhất:**

- Approved hoặc InProgress: màu nổi bật.
- Pending: màu cảnh báo nhẹ.
- Completed: màu hoàn thành.
- Cancelled hoặc Rejected: màu xám/đỏ nhạt.
- Maintenance: màu riêng để phân biệt với booking.

---

## MH-11. Danh sách phòng lab

**Route đề xuất:** `/app/labs`

**Chế độ hiển thị:** Card hoặc bảng.

**Dữ liệu:**

- Tên phòng.
- Mã phòng.
- Vị trí.
- Sức chứa.
- Trạng thái.

**Bộ lọc:**

- Từ khóa.
- Trạng thái phòng.
- LabManager phụ trách.
- Sức chứa tối thiểu.
- Phân trang.

**API:**

- `GET /api/LabRooms`.
- `GET /api/LabRooms/search`.

**Thao tác chung:**

- Xem chi tiết.
- Xem lịch của phòng.
- Tạo booking phòng.

**Thao tác riêng của Admin:**

- Tạo phòng mới.
- Sửa phòng.
- Đổi LabManager.
- Ngừng sử dụng/xóa phòng.

---

## MH-12. Chi tiết phòng lab

**Route đề xuất:** `/app/labs/:labId`

**Thông tin hiển thị:**

- Ảnh phòng.
- Tên phòng.
- Mã phòng.
- Vị trí.
- Sức chứa.
- Mô tả.
- Hướng dẫn sử dụng.
- Trạng thái.
- LabManager phụ trách.

**Các tab:**

1. Tổng quan.
2. Thiết bị trong phòng.
3. Lịch booking và bảo trì.
4. Lịch bảo trì của phòng.

**API:**

- `GET /api/LabRooms/{id}`.
- `GET /api/Equipments/lab/{labId}`.
- `GET /api/Maintenances/lab/{labId}`.
- `GET /api/Bookings/calendar` với `labId`.

**Nút thao tác:**

- Đặt cả phòng.
- Chọn thiết bị trong phòng để đặt.
- Admin: Sửa thông tin.
- Admin: Đổi người quản lý.
- Admin: Ngừng sử dụng phòng.
- Admin/LabManager: Tạo lịch bảo trì phòng nếu có quyền.

---

## MH-13. Danh sách thiết bị

**Route đề xuất:** `/app/equipments`

**Dữ liệu:**

- Tên thiết bị.
- Phòng chứa thiết bị.
- Trạng thái.
- Ảnh đại diện nếu có.

**Bộ lọc:**

- Từ khóa.
- Phòng lab.
- Trạng thái thiết bị.
- Phân trang.

**Trạng thái:**

- Available.
- InUse.
- Maintenance.
- Broken.
- Retired.

**API:**

- `GET /api/Equipments`.
- `GET /api/Equipments/search`.

**Thao tác chung:**

- Xem chi tiết.
- Xem lịch.
- Tạo booking thiết bị.

**Thao tác Admin:**

- Thêm thiết bị.
- Sửa thiết bị.
- Ngừng sử dụng/xóa thiết bị.

---

## MH-14. Chi tiết thiết bị

**Route đề xuất:** `/app/equipments/:equipmentId`

**Thông tin:**

- Tên thiết bị.
- Phòng lab chứa thiết bị.
- Model/thông số kỹ thuật.
- Ảnh.
- Hướng dẫn sử dụng.
- Trạng thái.

**Các tab:**

1. Tổng quan.
2. Lịch booking và bảo trì.
3. Lịch bảo trì thiết bị.

**API:**

- `GET /api/Equipments/{id}`.
- `GET /api/Maintenances/equipment/{equipmentId}`.
- `GET /api/Bookings/calendar` với `equipmentId`.

**Nút:**

- Đặt thiết bị.
- Xem phòng chứa thiết bị.
- Admin: Sửa.
- Admin: Ngừng sử dụng.
- Admin/LabManager: Tạo lịch bảo trì thiết bị nếu có quyền.

---

# C. Màn hình dành cho Requester

## MH-15. Tạo booking

**Route đề xuất:** `/app/bookings/new`

Nên làm theo dạng wizard 3 hoặc 4 bước để dễ sử dụng.

### Bước 1. Chọn tài nguyên

- Chọn đặt cả phòng hoặc đặt thiết bị.
- Chọn phòng lab.
- Nếu đặt thiết bị, hiển thị thiết bị thuộc phòng đã chọn.
- Cho phép chọn nhiều thiết bị nhưng tất cả phải thuộc cùng một phòng lab.
- Không cho chọn trùng tài nguyên.
- Ghi chú riêng cho từng tài nguyên.

### Bước 2. Chọn thời gian

- Ngày bắt đầu.
- Giờ bắt đầu.
- Ngày kết thúc.
- Giờ kết thúc.
- Nút kiểm tra lịch.
- Hiển thị lịch rảnh/bận của tài nguyên.

### Bước 3. Nhập mục đích

- Loại mục đích:
  - ResearchProject.
  - CoursePractice.
  - SelfStudy.
  - Other.
- Mô tả mục đích.
- Hiển thị mức ưu tiên tương ứng lấy từ quy tắc đang hoạt động.

### Bước 4. Xác nhận

- Tóm tắt tài nguyên.
- Thời gian.
- Mục đích.
- Mức ưu tiên.
- Nút Gửi yêu cầu booking.

**API:**

- `GET /api/PriorityRules/active`.
- `GET /api/Bookings/calendar`.
- `POST /api/Bookings/suggested-slots`.
- `POST /api/Bookings`.

**Khi bị trùng lịch:**

- Hiển thị các khung giờ thay thế do backend trả về.
- Có nút chọn một khung giờ đề xuất.
- Có nút Tham gia hàng chờ cho đúng tài nguyên và khung giờ.

**Điều kiện backend cần thể hiện trên UI:**

- Chỉ tài khoản Active mới tạo hoặc sửa booking.
- Tài khoản Restricted không được đặt lịch cho tới khi hết thời hạn hạn chế.
- Phòng Inactive/Unavailable không được đặt.
- Thiết bị Broken/Retired không được đặt.
- Một booking chỉ chứa tài nguyên thuộc cùng một phòng lab.
- Nên gửi thời gian theo ISO và thống nhất chuyển đổi UTC.

---

## MH-16. Booking của tôi

**Route đề xuất:** `/app/bookings/my`

**Dạng hiển thị:** Bảng và tab theo trạng thái.

**Các tab:**

- Tất cả.
- Pending.
- Approved.
- Rejected.
- Cancelled.
- Completed.
- NoShow.

**Cột:**

- Mã booking.
- Mục đích.
- Thời gian.
- Mức ưu tiên.
- Trạng thái.
- Ngày tạo.
- Thao tác.

**API:** `GET /api/Bookings/user/{userId}`.

**Thao tác:**

- Xem chi tiết.
- Sửa booking khi còn được phép.
- Hủy booking.
- Check-in khi tới thời gian hợp lệ.
- Xem lý do từ chối.
- Xem vi phạm liên quan.

Backend chưa có phân trang và bộ lọc cho API này. Frontend có thể lọc dữ liệu đã tải hoặc bổ sung API sau.

---

## MH-17. Chi tiết booking

**Route đề xuất:** `/app/bookings/:bookingId`

Đây là màn hình quan trọng và được dùng cho cả Requester, LabManager và Admin. Các nút hiển thị theo vai trò và trạng thái.

**Thông tin chung:**

- Mã booking.
- Người tạo.
- Mục đích và mô tả.
- Mức ưu tiên.
- Thời gian bắt đầu và kết thúc.
- Trạng thái.
- Người duyệt.
- Thời gian duyệt.
- Lý do từ chối.
- Ngày tạo.

**Danh sách tài nguyên:**

- BookingItem ID.
- Loại tài nguyên.
- Tên phòng hoặc thiết bị.
- Ghi chú.
- Trạng thái check-in/check-out.
- Nhật ký sử dụng của từng tài nguyên.

**API:**

- `GET /api/Bookings/{id}`.
- `GET /api/UsageLogs/booking/{bookingId}`.
- `GET /api/Violations/booking/{bookingId}`.

**Nút dành cho chủ booking:**

- Sửa khi booking vẫn cho phép cập nhật.
- Hủy booking.
- Check-in từng BookingItem.
- Check-out từng UsageLog.
- Báo sự cố sau khi check-in.

**Nút dành cho Admin/LabManager:**

- Approve.
- Reject và nhập lý do.
- Cancel.
- Complete.
- Mark NoShow.
- Xem hoặc xử lý sự cố.
- Tạo vi phạm thủ công nếu cần.

**Quy tắc thời gian cần hiển thị:**

- Check-in được phép từ 15 phút trước giờ bắt đầu đến 30 phút sau giờ bắt đầu, nhưng không vượt quá giờ kết thúc.
- Chỉ booking Approved mới check-in/check-out.
- NoShow chỉ được đánh dấu sau 30 phút kể từ giờ bắt đầu và khi chưa có check-in.
- Approved booking không được hủy sau khi đã tới giờ bắt đầu.
- Booking có tài nguyên chưa checkout thì không được hủy.

---

## MH-18. Hàng chờ của tôi

**Route đề xuất:** `/app/waitlists/my`

**Các tab:**

- Waiting.
- Notified.
- Booked.
- Cancelled.
- Expired.

**Thông tin:**

- Mã hàng chờ.
- Phòng hoặc thiết bị.
- Khung giờ yêu cầu.
- Vị trí trong hàng chờ.
- Thời điểm được thông báo.
- Trạng thái.

**API:**

- `GET /api/Waitlists/user/{userId}`.
- `GET /api/Waitlists/{id}`.
- `POST /api/Waitlists/{id}/booked`.
- `POST /api/Waitlists/{id}/cancel`.

**Nút:**

- Hủy hàng chờ.
- Khi trạng thái Notified: Tạo booking ngay.
- Sau khi tạo booking thành công: đánh dấu Booked.

**Cảnh báo thời gian:**

- Backend giữ lượt Notified trong 30 phút.
- Background service kiểm tra mỗi 5 phút.
- UI nên có đồng hồ đếm ngược dựa trên `NotifiedAt`.
- Khi hết thời gian, bản ghi chuyển Expired và người tiếp theo được thông báo.

---

## MH-19. Vi phạm và điểm phạt của tôi

**Route đề xuất:** `/app/violations/my`

**Phần tổng quan:**

- Tổng điểm phạt.
- Trạng thái tài khoản.
- Thời gian bị hạn chế đến ngày nào.
- Số vi phạm Active.
- Tổng điểm từ các vi phạm Active.

**Danh sách vi phạm:**

- Mã vi phạm.
- Booking liên quan.
- Loại vi phạm.
- Điểm bị cộng.
- Ngày ghi nhận.
- Trạng thái.

**Loại vi phạm:**

- NoShow.
- LateCheckout.
- DamageEquipment.
- MisuseEquipment.
- UnauthorizedUse.

**API:**

- `GET /api/Violations/user/{userId}`.
- `GET /api/Violations/user/{userId}/active`.
- `GET /api/Violations/user/{userId}/summary`.

---

# D. Màn hình nghiệp vụ dành cho Admin và LabManager

## MH-20. Quản lý toàn bộ booking

**Route đề xuất:** `/app/management/bookings`

**Quyền:** Admin và LabManager.

**Cột:**

- Booking ID.
- Người đặt.
- Mục đích.
- Mức ưu tiên.
- Thời gian.
- Trạng thái.
- Ngày tạo.
- Thao tác.

**Bộ lọc frontend nên có:**

- Từ khóa người dùng hoặc mã booking.
- Trạng thái.
- Mục đích.
- Khoảng thời gian.
- Phòng lab.

**API:** `GET /api/Bookings`.

**Lưu ý:** Backend hiện chưa nhận bộ lọc và phân trang cho danh sách booking. Có thể lọc ở frontend với dữ liệu hiện có hoặc bổ sung API sau.

**Thao tác:**

- Xem chi tiết.
- Duyệt hoặc từ chối Pending.
- Hủy.
- Hoàn thành.
- Đánh dấu NoShow.

---

## MH-21. Hàng đợi booking cần duyệt

**Route đề xuất:** `/app/management/bookings/pending`

**Mục tiêu:** Tập trung xử lý các booking Pending theo đúng thứ tự ưu tiên.

**Sắp xếp:**

1. PriorityLevel tăng dần, số nhỏ được ưu tiên trước.
2. Nếu bằng ưu tiên thì CreatedAt tăng dần.

**Cột:**

- Thứ tự xử lý.
- Mã booking.
- Người đặt.
- Khoa/phòng ban nếu frontend lấy thêm được.
- Mục đích.
- PriorityLevel.
- Thời gian.
- Tài nguyên.
- Ngày gửi.

**API:** `GET /api/Bookings/pending`.

**Nút nhanh:**

- Xem chi tiết.
- Duyệt.
- Từ chối.

**Modal từ chối:**

- Lý do từ chối bắt buộc.
- Nút xác nhận.

**Lưu ý:** Khi duyệt, backend sẽ kiểm tra lại xung đột và thứ tự ưu tiên trong transaction. Frontend phải hiển thị lỗi 409 rõ ràng nếu tài nguyên vừa được booking khác chiếm.

---

## MH-22. Quản lý bảo trì

**Route đề xuất:** `/app/management/maintenances`

**Người xem:** Tất cả người dùng đăng nhập có thể xem lịch bảo trì. Nút quản lý chỉ hiển thị cho Admin và LabManager.

**Kiểu hiển thị:**

- Bảng.
- Lịch tuần/tháng.
- Có thể chuyển qua lại giữa hai chế độ.

**Cột:**

- Maintenance ID.
- Tài nguyên.
- Phòng lab liên quan.
- Thời gian.
- Trạng thái.
- Loại lặp.
- Thời gian kết thúc chuỗi lặp.
- Thao tác.

**Trạng thái:**

- Scheduled.
- InProgress.
- Completed.
- Cancelled.

**Bộ lọc frontend:**

- Phòng lab.
- Thiết bị.
- Trạng thái.
- Khoảng ngày.
- Bảo trì đơn lẻ hoặc định kỳ.

**API:**

- `GET /api/Maintenances`.
- `GET /api/Maintenances/lab/{labId}`.
- `GET /api/Maintenances/equipment/{equipmentId}`.

**Thao tác Admin/LabManager:**

- Tạo lịch bảo trì.
- Sửa lịch.
- Bắt đầu.
- Hoàn thành.
- Hủy một lần bảo trì.
- Hủy cả chuỗi định kỳ.

---

## MH-23. Tạo hoặc sửa lịch bảo trì

**Route đề xuất:**

- Tạo: `/app/management/maintenances/new`.
- Sửa: `/app/management/maintenances/:id/edit`.

Có thể làm bằng drawer lớn thay vì trang riêng.

**Trường nhập:**

- Loại tài nguyên: Phòng lab hoặc Thiết bị.
- LabId hoặc EquipmentId. Chỉ được chọn đúng một loại.
- Thời gian bắt đầu.
- Thời gian kết thúc.
- Chi phí bảo trì.
- Ghi chú.
- Loại lặp:
  - None.
  - Daily.
  - Weekly.
  - Monthly.
- Khoảng lặp.
- Ngày kết thúc chuỗi lặp.

**API:**

- `POST /api/Maintenances`.
- `PUT /api/Maintenances/{id}`.

**Kiểm tra UI:**

- Thời gian bắt đầu nhỏ hơn thời gian kết thúc.
- Thời gian phải ở tương lai khi tạo/sửa.
- Chỉ chọn một trong Lab hoặc Equipment.
- Không trùng booking đang chặn tài nguyên.
- Không trùng lịch bảo trì khác.
- LabManager chỉ chọn tài nguyên thuộc phòng mình quản lý.

---

## MH-24. Chi tiết bảo trì

**Route đề xuất:** `/app/management/maintenances/:id`

**Thông tin:**

- Maintenance ID.
- Phòng hoặc thiết bị.
- Người tạo.
- Thời gian.
- Thời lượng.
- Chi phí.
- Ghi chú.
- Trạng thái.
- Loại lặp.
- Khoảng lặp.
- Ngày kết thúc lặp.
- ParentMaintenanceId.
- Chuỗi lặp đã dừng hay chưa.

**API:** `GET /api/Maintenances/{id}`.

**Nút theo trạng thái:**

- Scheduled: Sửa, Bắt đầu, Hủy một lần, Hủy cả chuỗi.
- InProgress: Hoàn thành, Hủy một lần, Hủy cả chuỗi.
- Completed/Cancelled: chỉ xem.

**Lưu ý:**

- Chỉ bắt đầu khi đã tới giờ bắt đầu và chưa tới giờ kết thúc.
- Không bắt đầu nếu tài nguyên đang có lượt sử dụng chưa checkout.
- Hủy một lần không làm dừng các kỳ lặp sau.
- Hủy cả chuỗi sẽ dừng toàn bộ lịch định kỳ còn hoạt động.

---

## MH-25. Quản lý nhật ký sử dụng

**Route đề xuất:** `/app/management/usage-logs`

**Quyền:** Admin và LabManager.

**Cột:**

- Log ID.
- BookingItem ID.
- Booking ID nếu frontend ghép thêm.
- Thời gian check-in.
- Thời gian check-out.
- Trạng thái sự cố.
- Trạng thái duyệt sự cố.
- Người duyệt.
- Thời gian duyệt.

**API:**

- `GET /api/UsageLogs`.
- `GET /api/UsageLogs/{id}`.
- `GET /api/UsageLogs/booking/{bookingId}`.
- `GET /api/UsageLogs/booking-item/{bookingItemId}`.

**Thao tác:**

- Xem booking liên quan.
- Xem chi tiết log.
- Check-out thay người dùng khi có quyền và đúng nghiệp vụ.
- Báo sự cố.
- Mở màn hình duyệt sự cố.

**Lưu ý:** ActualCheckin và ActualCheckout nên để null trong luồng bình thường. Chỉ Admin/LabManager được nhập thời gian lịch sử để sửa dữ liệu.

---

## MH-26. Duyệt sự cố sử dụng

**Route đề xuất:** `/app/management/incidents`

**Bộ lọc:**

- Từ ngày.
- Đến ngày.
- Trạng thái duyệt: Pending, Confirmed, Rejected.
- Loại sự cố.

**Cột:**

- Log ID.
- BookingItem ID.
- Loại sự cố.
- Mô tả.
- Thiết bị bị ảnh hưởng.
- Trạng thái duyệt.
- Người báo.
- Thời gian check-in/check-out.

**API:**

- `GET /api/UsageLogs/incidents?from=...&to=...`.
- `POST /api/UsageLogs/{id}/incident/confirm`.
- `POST /api/UsageLogs/{id}/incident/reject`.

**Modal duyệt:**

- Nội dung sự cố.
- Thiết bị bị ảnh hưởng.
- Ghi chú xét duyệt.
- Nút Xác nhận sự cố.
- Nút Từ chối sự cố.

**Tác động nghiệp vụ:**

- Sự cố được xác nhận có thể tạo vi phạm tự động tùy loại.
- Frontend nên cảnh báo trước khi xác nhận vì có thể làm tăng điểm phạt của người dùng.

---

## MH-27. Quản lý hàng chờ

**Route đề xuất:** `/app/management/waitlists`

**Quyền:** Admin và LabManager.

**Các tab:**

- Tất cả.
- Waiting.
- Notified.
- Booked.
- Cancelled.
- Expired.

**Bộ lọc hàng đợi cụ thể:**

- Phòng lab hoặc thiết bị.
- RequestedStart.
- RequestedEnd.

**Cột:**

- Waitlist ID.
- User ID.
- Tài nguyên.
- Khung giờ.
- QueuePosition.
- NotifiedAt.
- Trạng thái.

**API:**

- `GET /api/Waitlists`.
- `GET /api/Waitlists/queue`.
- `POST /api/Waitlists/notify-next`.
- `POST /api/Waitlists/{id}/expire`.
- `POST /api/Waitlists/{id}/cancel`.

**Thao tác:**

- Xem chi tiết.
- Thông báo người tiếp theo.
- Cho hết hạn thủ công.
- Hủy bản ghi nếu có quyền.

---

## MH-28. Quản lý vi phạm

**Route đề xuất:** `/app/management/violations`

**Quyền:** Admin và LabManager.

**Các tab:**

- Tất cả.
- Active.
- Resolved.
- Cancelled.

**Cột:**

- Violation ID.
- Người dùng.
- Booking ID.
- Loại vi phạm.
- Điểm phạt.
- Ngày ghi nhận.
- Trạng thái.

**API:**

- `GET /api/Violations`.
- `GET /api/Violations/{id}`.
- `GET /api/Violations/booking/{bookingId}`.
- `POST /api/Violations`.
- `POST /api/Violations/{id}/resolve`.
- `POST /api/Violations/{id}/cancel`.

**Thao tác:**

- Tạo vi phạm thủ công.
- Xem booking liên quan.
- Xem tổng hợp vi phạm của người dùng.
- Resolve.
- Cancel.

**Form tạo vi phạm:**

- Người dùng bị vi phạm.
- Booking liên quan.
- Loại vi phạm.
- Hiển thị điểm phạt dự kiến trước khi xác nhận nếu frontend biết quy tắc.

**Lưu ý:** LabManager chỉ quản lý vi phạm thuộc phòng mình phụ trách.

---

## MH-29. Trung tâm báo cáo

**Route đề xuất:** `/app/reports`

Nên làm một màn hình có nhiều tab thay vì tạo 13 trang riêng.

**Bộ lọc chung:**

- Từ ngày.
- Đến ngày.
- Top N cho các bảng xếp hạng.
- Nhóm xu hướng theo ngày, tuần hoặc tháng.

### Tab 1. Tổng quan

- Các KPI chính.
- Booking theo trạng thái.
- Booking theo mục đích.
- NoShow rate.
- Xu hướng sử dụng.

### Tab 2. Mức sử dụng tài nguyên

- Tỷ lệ sử dụng từng phòng lab.
- Tỷ lệ sử dụng từng thiết bị.
- BookingCount.
- ReservedHours.
- UsageCount.
- ActualUsageHours.
- AvailableHours.
- UtilizationRate.

### Tab 3. Khoa/phòng ban

- Booking theo khoa/phòng ban.
- Mức sử dụng theo khoa/phòng ban.
- UsageSharePercentage.

### Tab 4. Tài nguyên dùng nhiều nhất

- Top phòng lab.
- Top thiết bị.
- BookingCount.
- ReservedHours.
- UsageCount.
- ActualUsageHours.

### Tab 5. Bảo trì

- Chi phí bảo trì theo phòng.
- Chi phí bảo trì theo thiết bị.
- Số lần bảo trì.
- Tổng chi phí.

### Tab 6. Lịch sử bảo trì

- Khoảng ngày.
- Trạng thái.
- Phòng.
- Thiết bị.
- Người tạo.
- Phân trang.
- Tổng chi phí trong kỳ.

### Tab 7. Vi phạm

- Tổng vi phạm.
- Active, Resolved, Cancelled.
- Vi phạm theo loại.
- Danh sách chi tiết.
- Người dùng có điểm phạt cao nhất.

### Tab 8. Xu hướng sử dụng

- Theo ngày.
- Theo tuần.
- Theo tháng.
- Số lượt sử dụng.
- Tổng giờ sử dụng.

**API:**

- `GET /api/Reports/lab-utilization`.
- `GET /api/Reports/equipment-utilization`.
- `GET /api/Reports/bookings/by-department`.
- `GET /api/Reports/department-utilization`.
- `GET /api/Reports/bookings/by-purpose`.
- `GET /api/Reports/bookings/by-status`.
- `GET /api/Reports/maintenance-costs/by-lab`.
- `GET /api/Reports/maintenance-costs/by-equipment`.
- `GET /api/Reports/maintenance-history`.
- `GET /api/Reports/most-used/labs`.
- `GET /api/Reports/most-used/equipments`.
- `GET /api/Reports/violations`.
- `GET /api/Reports/penalty-users`.
- `GET /api/Reports/no-show-rate`.
- `GET /api/Reports/usage-trend`.

**Lưu ý:** Backend chưa có endpoint export Excel/PDF. Nếu cần export ngay, frontend chỉ có thể xuất dữ liệu đã tải; tốt hơn là bổ sung API export sau.

---

# E. Màn hình riêng của Admin

## MH-30. Danh sách người dùng

**Route đề xuất:** `/app/admin/users`

**Bộ lọc:**

- Từ khóa theo họ tên, username hoặc email.
- Vai trò.
- Khoa/phòng ban.
- Trạng thái.
- Phân trang.

**Cột:**

- User ID.
- Họ tên.
- Username.
- Email.
- Vai trò.
- Khoa/phòng ban.
- Điểm phạt.
- RestrictionUntil.
- Trạng thái.
- Thao tác.

**API:** `GET /api/Users`.

**Nút:**

- Tạo người dùng.
- Xem chi tiết.
- Sửa.
- Đổi vai trò.
- Đổi khoa/phòng ban.
- Khóa hoặc mở khóa.
- Kích hoạt hoặc ngừng hoạt động.
- Đặt trạng thái Restricted.
- Xem điểm phạt.

---

## MH-31. Tạo người dùng

**Route đề xuất:** `/app/admin/users/new`

Có thể dùng modal hoặc drawer lớn.

**Trường nhập:**

- Họ tên.
- Username.
- Email.
- Mật khẩu ban đầu.
- Khoa/phòng ban.
- Vai trò: Admin, LabManager hoặc Requester.

**API:** `POST /api/Auth/create-user`.

**Lưu ý UI:**

- Username và email phải duy nhất.
- Nên có kiểm tra độ mạnh mật khẩu ở frontend.
- Danh sách khoa lấy từ `GET /api/Departments?activeOnly=true`.
- Danh sách vai trò lấy từ `GET /api/Roles` hoặc dùng enum cố định nếu cần.

---

## MH-32. Chi tiết và chỉnh sửa người dùng

**Route đề xuất:** `/app/admin/users/:userId`

**Thông tin:**

- Họ tên.
- Username.
- Email.
- Vai trò.
- Khoa/phòng ban.
- Điểm phạt.
- Trạng thái.
- RestrictionUntil.

**Các khối:**

1. Thông tin cơ bản.
2. Quyền và đơn vị.
3. Trạng thái tài khoản.
4. Điểm phạt và vi phạm.
5. Booking của người dùng nếu cần liên kết.

**API:**

- `GET /api/Users/{id}`.
- `PUT /api/Users/{id}`.
- `PUT /api/Users/{id}/role`.
- `PUT /api/Users/{id}/department`.
- `POST /api/Users/{id}/lock`.
- `POST /api/Users/{id}/unlock`.
- `POST /api/Users/{id}/deactivate`.
- `POST /api/Users/{id}/activate`.
- `PUT /api/Users/{id}/status`.
- `GET /api/Users/{id}/penalty`.
- `GET /api/Violations/user/{id}/summary`.

**Modal đổi trạng thái:**

- Chọn Active, Inactive, Restricted hoặc Locked.
- Nếu Restricted, nhập RestrictionUntil.
- Yêu cầu xác nhận trước khi lưu.

**Lưu ý nghiệp vụ:**

- Không được tự làm mất quyền quản trị của Admin hiện tại.
- Không đổi LabManager sang vai trò khác khi họ vẫn đang quản lý phòng lab; phải chuyển phòng cho người khác trước.

---

## MH-33. Quản lý khoa/phòng ban

**Route đề xuất:** `/app/admin/departments`

**Cột:**

- Department ID.
- Tên khoa/phòng ban.
- Mô tả.
- Trạng thái.
- Thao tác.

**API:**

- `GET /api/Departments`.
- `GET /api/Departments/{id}`.
- `POST /api/Departments`.
- `PUT /api/Departments/{id}`.
- `DELETE /api/Departments/{id}` để chuyển Inactive.
- `POST /api/Departments/{id}/activate`.

**Thao tác:**

- Thêm.
- Sửa.
- Ngừng hoạt động.
- Kích hoạt lại.

Không nên xóa cứng vì người dùng cũ có thể đang thuộc khoa đó.

---

## MH-34. Quản lý quy tắc ưu tiên

**Route đề xuất:** `/app/admin/priority-rules`

**Cột:**

- PriorityRule ID.
- PurposeType.
- PriorityLevel.
- Mô tả.
- Trạng thái.

**API:**

- `GET /api/PriorityRules`.
- `GET /api/PriorityRules/active`.
- `GET /api/PriorityRules/{id}`.
- `GET /api/PriorityRules/purpose/{purposeType}`.
- `POST /api/PriorityRules`.
- `PUT /api/PriorityRules/{id}`.
- `POST /api/PriorityRules/{id}/activate`.
- `POST /api/PriorityRules/{id}/deactivate`.

**Form:**

- PurposeType.
- PriorityLevel.
- Mô tả.

**Lưu ý hiển thị:**

- PriorityLevel càng nhỏ thì ưu tiên càng cao.
- Không nên hardcode ResearchProject luôn là số 1; frontend phải lấy dữ liệu quy tắc đang Active.
- Cảnh báo Admin rằng thay đổi quy tắc sẽ ảnh hưởng thứ tự duyệt booking mới và booking Pending đang sử dụng PriorityLevel.

---

## MH-35. Gửi thông báo hệ thống

**Route đề xuất:** `/app/admin/notifications/send`

**Form:**

- Chọn người nhận.
- Tiêu đề.
- Nội dung.
- Loại thông báo.
- Nút xem trước.
- Nút gửi.

**API:** `POST /api/Notifications/send`.

**Giới hạn backend:**

- Mỗi request hiện gửi cho một UserId.
- Chưa có API gửi hàng loạt theo role hoặc khoa.
- Nếu muốn gửi hàng loạt, cần bổ sung backend hoặc frontend lặp nhiều request, nhưng cách lặp nhiều request không tối ưu.

---

## MH-36. Audit log

**Route đề xuất:** `/app/admin/audit-logs`

**Bộ lọc:**

- UserId.
- ActionType.
- EntityName.
- EntityId.
- Từ ngày.
- Đến ngày.
- Phân trang.

**Cột:**

- AuditLog ID.
- Người thao tác.
- ActionType.
- EntityName.
- EntityId.
- IP Address.
- CreatedAt.
- Nút xem thay đổi.

**API:**

- `GET /api/AuditLogs`.
- `GET /api/AuditLogs/{id}`.

**Drawer chi tiết:**

- OldValue.
- NewValue.
- Dữ liệu JSON nên được format dễ đọc.
- Làm nổi bật trường đã thay đổi.

**ActionType hiện có:**

- Create.
- Update.
- Delete.
- Login.
- Logout.
- ApproveBooking.
- RejectBooking.
- CheckIn.
- CheckOut.

---

## MH-37. Danh sách vai trò

**Route đề xuất:** `/app/admin/roles`

**Mục tiêu:** Trang tham chiếu quyền, không cần làm CRUD vì backend chỉ có API đọc.

**Cột:**

- Role ID.
- RoleName.
- Description.

**API:**

- `GET /api/Roles`.
- `GET /api/Roles/{id}`.

Có thể bỏ route riêng và chỉ dùng dữ liệu này trong form người dùng. Tuy nhiên nếu đề tài cần thể hiện module Role rõ ràng thì nên giữ trang read-only này.

---

# 5. Các modal, drawer và hộp xác nhận cần có

Những mục sau không nên tách thành màn hình riêng:

1. Xác nhận đăng xuất.
2. Xác nhận hủy booking.
3. Nhập lý do từ chối booking.
4. Xác nhận duyệt booking.
5. Xác nhận Complete booking.
6. Xác nhận Mark NoShow.
7. Tham gia hàng chờ.
8. Xác nhận hủy hàng chờ.
9. Check-in từng BookingItem.
10. Check-out từng UsageLog.
11. Báo sự cố sử dụng.
12. Xác nhận hoặc từ chối sự cố.
13. Tạo hoặc sửa vi phạm.
14. Resolve hoặc Cancel vi phạm.
15. Tạo hoặc sửa khoa/phòng ban.
16. Tạo hoặc sửa phòng lab.
17. Đổi LabManager cho phòng.
18. Tạo hoặc sửa thiết bị.
19. Tạo hoặc sửa quy tắc ưu tiên.
20. Bắt đầu, hoàn thành hoặc hủy bảo trì.
21. Hủy một kỳ bảo trì hoặc cả chuỗi.
22. Đổi vai trò người dùng.
23. Đổi khoa/phòng ban người dùng.
24. Đổi trạng thái người dùng.
25. Khóa, mở khóa, kích hoạt hoặc ngừng hoạt động tài khoản.
26. Xem OldValue/NewValue của audit log.

---

# 6. Ma trận quyền màn hình

| Màn hình/chức năng | Requester | LabManager | Admin |
|---|:---:|:---:|:---:|
| Đăng nhập, quên mật khẩu, reset mật khẩu | Có | Có | Có |
| Xem hồ sơ cá nhân | Có | Có | Có |
| Xem thông báo cá nhân | Có | Có | Có |
| Xem phòng lab và thiết bị | Có | Có | Có |
| Xem lịch tài nguyên | Có | Có | Có |
| Tạo booking | Có | Có nếu dùng như người đặt | Có |
| Xem booking của mình | Có | Có | Có |
| Duyệt/từ chối booking | Không | Có, trong phòng quản lý | Có |
| Complete/NoShow booking | Không | Có, trong phòng quản lý | Có |
| Tham gia hàng chờ | Có | Có | Có |
| Quản lý hàng chờ | Không | Có, trong phòng quản lý | Có |
| Check-in/check-out booking của mình | Có | Có | Có |
| Xem toàn bộ usage log | Không | Có, trong phạm vi | Có |
| Báo sự cố | Có | Có | Có |
| Xác nhận/từ chối sự cố | Không | Có, trong phạm vi | Có |
| Xem vi phạm của mình | Có | Có | Có |
| Quản lý vi phạm | Không | Có, trong phạm vi | Có |
| Xem lịch bảo trì | Có | Có | Có |
| Tạo/sửa/xử lý bảo trì | Không | Có, trong phòng quản lý | Có |
| Dashboard báo cáo | Không | Có, trong phòng quản lý | Có |
| CRUD phòng lab | Không | Không | Có |
| CRUD thiết bị | Không | Không | Có |
| Quản lý người dùng | Không | Không | Có |
| Quản lý khoa/phòng ban | Không | Không | Có |
| Quản lý quy tắc ưu tiên | Không | Không | Có |
| Gửi thông báo thủ công | Không | Không | Có |
| Xem audit log | Không | Không | Có |
| Xem danh sách role | Không | Không | Có |

---

# 7. Các trạng thái cần chuẩn hóa trên frontend

## 7.1. UserStatus

| Backend | Nhãn tiếng Việt đề xuất |
|---|---|
| Active | Đang hoạt động |
| Inactive | Ngừng hoạt động |
| Restricted | Bị hạn chế đặt lịch |
| Locked | Bị khóa |

## 7.2. BookingStatus

| Backend | Nhãn tiếng Việt |
|---|---|
| Pending | Chờ duyệt |
| Approved | Đã duyệt |
| Rejected | Bị từ chối |
| Cancelled | Đã hủy |
| Completed | Hoàn thành |
| NoShow | Không đến |

## 7.3. LabRoomStatus

| Backend | Nhãn tiếng Việt |
|---|---|
| Available | Có thể sử dụng |
| Unavailable | Tạm không khả dụng |
| Maintenance | Đang bảo trì |
| Inactive | Ngừng hoạt động |

## 7.4. EquipmentStatus

| Backend | Nhãn tiếng Việt |
|---|---|
| Available | Sẵn sàng |
| InUse | Đang sử dụng |
| Maintenance | Đang bảo trì |
| Broken | Bị hỏng |
| Retired | Ngừng sử dụng |

## 7.5. MaintenanceStatus

| Backend | Nhãn tiếng Việt |
|---|---|
| Scheduled | Đã lên lịch |
| InProgress | Đang thực hiện |
| Completed | Hoàn thành |
| Cancelled | Đã hủy |

## 7.6. WaitlistStatus

| Backend | Nhãn tiếng Việt |
|---|---|
| Waiting | Đang chờ |
| Notified | Đã được thông báo |
| Booked | Đã tạo booking |
| Cancelled | Đã hủy |
| Expired | Hết hạn nhận chỗ |

## 7.7. ViolationStatus

| Backend | Nhãn tiếng Việt |
|---|---|
| Active | Đang hiệu lực |
| Resolved | Đã xử lý |
| Cancelled | Đã hủy |

## 7.8. IncidentReviewStatus

| Backend | Nhãn tiếng Việt |
|---|---|
| NotRequired | Không cần duyệt |
| Pending | Chờ duyệt |
| Confirmed | Đã xác nhận |
| Rejected | Đã từ chối |

---

# 8. Luồng nghiệp vụ chính cần thể hiện trên giao diện

## 8.1. Luồng tạo booking

1. Requester chọn phòng hoặc thiết bị.
2. Chọn thời gian.
3. Xem lịch tài nguyên.
4. Chọn mục đích và nhập mô tả.
5. Hệ thống hiển thị mức ưu tiên.
6. Gửi booking.
7. Nếu không trùng lịch, booking được tạo ở trạng thái Pending.
8. Nếu trùng lịch, hiển thị khung giờ thay thế hoặc nút tham gia hàng chờ.
9. Admin/LabManager xem hàng Pending và duyệt theo ưu tiên.
10. Người dùng nhận thông báo Approved hoặc Rejected.

## 8.2. Luồng sử dụng tài nguyên

1. Booking phải ở trạng thái Approved.
2. Khi tới khung giờ cho phép, người dùng check-in từng tài nguyên.
3. Thiết bị/phòng chuyển sang trạng thái đang sử dụng theo nghiệp vụ backend.
4. Người dùng có thể báo sự cố.
5. Người dùng check-out từng tài nguyên.
6. Nếu checkout muộn, hệ thống có thể ghi nhận LateCheckout và tạo vi phạm.
7. Khi tất cả tài nguyên checkout, booking có thể được Complete.

## 8.3. Luồng NoShow

1. Booking Approved đã quá 30 phút từ giờ bắt đầu.
2. Chưa có bất kỳ usage log/check-in nào.
3. Admin hoặc LabManager chọn Mark NoShow.
4. Booking chuyển NoShow.
5. Hệ thống tạo vi phạm NoShow và thông báo người dùng.
6. Chỗ trống được chuyển tới hàng chờ nếu có.

## 8.4. Luồng hàng chờ

1. Tài nguyên bị chiếm trong khung giờ mong muốn.
2. Người dùng tham gia hàng chờ.
3. Hệ thống xếp QueuePosition.
4. Khi slot được giải phóng, người đầu tiên nhận thông báo.
5. Người đó có 30 phút để tạo booking.
6. Nếu tạo booking thành công, đánh dấu Waitlist là Booked.
7. Nếu hết 30 phút, Waitlist chuyển Expired và người tiếp theo được thông báo.

## 8.5. Luồng bảo trì

1. Admin/LabManager chọn đúng một phòng hoặc một thiết bị.
2. Nhập thời gian, chi phí, ghi chú và chu kỳ lặp.
3. Backend kiểm tra xung đột với booking và maintenance khác.
4. Lịch được tạo ở trạng thái Scheduled.
5. Tới thời gian thực hiện, chọn Start.
6. Tài nguyên chuyển trạng thái Maintenance.
7. Chọn Complete để hoàn thành hoặc Cancel để hủy.
8. Nếu là định kỳ, có thể hủy một kỳ hoặc hủy cả chuỗi.

## 8.6. Luồng sự cố và vi phạm

1. Người dùng báo sự cố trên usage log.
2. Sự cố chuyển Pending review nếu cần duyệt.
3. Admin/LabManager xem danh sách sự cố.
4. Chọn Confirm hoặc Reject và nhập ghi chú.
5. Sự cố được xác nhận có thể tạo vi phạm.
6. Vi phạm làm tăng điểm phạt.
7. Điểm phạt có thể khiến tài khoản chuyển Restricted.

---

# 9. Những chức năng backend chưa hỗ trợ đầy đủ cho frontend

Các mục dưới đây không nên tự thiết kế nút rồi gọi API không tồn tại:

1. **Không có đăng ký tài khoản công khai.** Chỉ Admin tạo tài khoản.
2. **Không có API người dùng tự sửa hồ sơ.** Trang profile hiện chỉ xem.
3. **Không có API đổi mật khẩu khi đang đăng nhập.** Chỉ có quên/reset mật khẩu qua email.
4. **Không có upload ảnh.** Phòng và thiết bị chỉ nhận `ImageUrl`; frontend cần nhập URL hoặc backend phải bổ sung upload.
5. **Không có API gửi thông báo hàng loạt.** Hiện gửi theo một UserId.
6. **Không có export báo cáo Excel/PDF.**
7. **Danh sách booking chưa có filter và pagination từ backend.**
8. **Danh sách maintenance thường chưa có filter và pagination.** Chỉ maintenance history trong Reports có bộ lọc/phân trang tốt hơn.
9. **Role chỉ có API xem, không có CRUD.**
10. **Không có API riêng để Requester lấy dashboard.** Phải ghép nhiều API.
11. **Create/Update phòng và thiết bị không có trường status trực tiếp.** Không nên tự thêm dropdown đổi trạng thái nếu backend chưa hỗ trợ.
12. **Không có endpoint xóa cứng khoa/phòng ban.** Delete hiện mang ý nghĩa Deactivate.

---

# 10. Thứ tự nên làm frontend

## Giai đoạn 1. Khung cơ bản

1. Login, refresh token, logout.
2. Layout, sidebar và route guard theo role.
3. Profile và notification badge.
4. Xử lý lỗi 401, 403, 404 và 409.

## Giai đoạn 2. Tài nguyên và booking

1. Danh sách/chi tiết phòng.
2. Danh sách/chi tiết thiết bị.
3. Lịch tài nguyên.
4. Tạo booking.
5. Booking của tôi.
6. Chi tiết booking.
7. Hàng chờ của tôi.

## Giai đoạn 3. Nghiệp vụ sử dụng

1. Check-in/check-out.
2. Báo sự cố.
3. Vi phạm của tôi.
4. Thông báo và điều hướng từ thông báo.

## Giai đoạn 4. LabManager

1. Booking cần duyệt.
2. Quản lý booking.
3. Bảo trì.
4. Usage log.
5. Duyệt sự cố.
6. Quản lý hàng chờ.
7. Quản lý vi phạm.
8. Dashboard và báo cáo.

## Giai đoạn 5. Admin

1. Quản lý người dùng.
2. Quản lý khoa/phòng ban.
3. CRUD phòng lab.
4. CRUD thiết bị.
5. Quy tắc ưu tiên.
6. Gửi thông báo.
7. Audit log.
8. Role read-only.

---

# 11. Checklist hoàn thành UI

## Bắt buộc

- [ ] Route guard theo vai trò.
- [ ] Tự refresh access token.
- [ ] Logout và xóa token.
- [ ] Hiển thị loading, empty state và error state.
- [ ] Hiển thị đúng lỗi 400, 401, 403, 404 và 409.
- [ ] Xác nhận trước các thao tác thay đổi trạng thái.
- [ ] Không hiển thị nút ngoài quyền.
- [ ] Chuyển đổi thời gian UTC đúng cách.
- [ ] Badge trạng thái thống nhất toàn hệ thống.
- [ ] Danh sách có tìm kiếm, filter hoặc phân trang khi API hỗ trợ.
- [ ] Responsive tối thiểu cho laptop và tablet.

## Nên có

- [ ] Breadcrumb.
- [ ] Skeleton loading.
- [ ] Toast thông báo thành công/thất bại.
- [ ] Đồng hồ đếm ngược cho Waitlist Notified.
- [ ] Calendar tháng/tuần/ngày.
- [ ] Biểu đồ dashboard.
- [ ] Format JSON đẹp trong audit log.
- [ ] Link qua lại giữa booking, usage log, violation và user.
- [ ] Cảnh báo tài khoản Restricted trên mọi trang.

---

# 12. Kết luận

Với backend hiện tại, frontend đầy đủ nên có **37 màn hình chính** như tài liệu này. Tuy nhiên, để sản phẩm gọn và dễ làm, nên tái sử dụng các màn hình sau:

- Chi tiết booking dùng chung cho cả 3 vai trò, chỉ thay đổi nút theo quyền.
- Danh sách và chi tiết phòng/thiết bị dùng chung, Admin được thêm nút quản lý.
- Trung tâm báo cáo dùng tab thay vì nhiều route riêng.
- Các form nhỏ và thao tác xác nhận dùng modal/drawer.
- Check-in, check-out và báo sự cố nên đặt ngay trong chi tiết booking, không cần tạo quá nhiều trang rời.

Nếu làm theo đúng thứ tự ở mục 10, phần frontend sẽ bám sát backend và tránh tình trạng thiết kế xong nhưng không có API để gọi.
