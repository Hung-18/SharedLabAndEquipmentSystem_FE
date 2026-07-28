# FIX REPORT — SHARED LAB FRONTEND

## Bản đã xử lý

Project được sửa trực tiếp từ `SharedLab-Frontend-GMAIL-SAME-TAB-FIXED(3).zip`.

## 1. Angular state và bộ lọc

Đã loại bỏ việc dùng `computed()` để đọc trực tiếp object/biến thường do `ngModel` cập nhật. Các giá trị phụ thuộc form và bộ lọc nay được tính lại đúng ở mỗi lần Angular change detection hoặc sử dụng Signal thực sự.

Đã xử lý tại các màn hình:

- Tạo người dùng.
- Gửi thông báo.
- Khoa/phòng ban.
- Booking của tôi.
- Tạo và sửa booking.
- Lịch tài nguyên.
- Tạo/sửa và danh sách bảo trì.
- Quản lý booking.
- Duyệt sự cố.
- Usage log.
- Vi phạm.
- Quản lý hàng chờ và hàng chờ của tôi.

Kết quả: nút, tab, tìm kiếm, filter và danh sách phòng–thiết bị cập nhật ngay, không cần reload.

## 2. Tạo người dùng

- Sửa nút **Tạo tài khoản** bị disabled vĩnh viễn.
- Đồng bộ validation mật khẩu với backend: tối thiểu 8 ký tự, có chữ hoa, chữ thường và chữ số.
- Sửa kiểu response của API tạo user về kiểu không phụ thuộc DTO sai.
- Thêm loading, thông báo lỗi và nút tải lại khi API Role/Department lỗi.
- Hiển thị message thật từ backend khi username/email trùng.

## 3. Waitlist

- Khi chọn thiết bị, request chỉ gửi `equipmentId`.
- Khi chọn phòng, request chỉ gửi `labId`.
- Không còn gửi đồng thời hai ID gây lỗi 400.
- Kiểm tra khung giờ trước khi xem queue hoặc notify next.
- Countdown hàng chờ cập nhật mỗi giây và được hủy timer khi rời trang.

## 4. Quên và đặt lại mật khẩu

- Chỉ báo gửi thành công sau khi backend trả response thành công.
- Không còn báo thành công giả khi backend/SMTP lỗi.
- Sau 0,9 giây, spinner chuyển sang trạng thái xử lý tĩnh để tránh cảm giác quay vô hạn; request vẫn tiếp tục an toàn.
- Chỉ cho mở Gmail sau khi request đã hoàn tất.
- Thêm timeout và thông báo lỗi rõ ràng.
- Validation mật khẩu reset đồng bộ backend.
- Reset thành công xóa phiên cũ và chuyển về login bằng `replaceUrl`.

## 5. Booking CRUD và điều kiện nghiệp vụ

- Thêm route `/app/bookings/:bookingId/edit`.
- Dùng lại booking wizard để sửa booking Pending của chính người tạo.
- Khóa thay đổi tài nguyên khi sửa; chỉ cập nhật thời gian và mục đích đúng API backend.
- Thêm nút sửa ở trang chi tiết booking.
- Cancel chỉ khả dụng trước giờ bắt đầu và khi không có usage chưa checkout.
- Complete chỉ khả dụng sau giờ kết thúc.
- NoShow chỉ khả dụng sau 30 phút kể từ giờ bắt đầu.
- API usage log/violation lỗi không còn làm mất toàn bộ dữ liệu chi tiết booking.

## 6. Maintenance

- Bộ lọc và danh sách thiết bị theo phòng cập nhật ngay.
- Chặn thời gian bắt đầu trong quá khứ khi tạo mới.
- Chặn start >= end, chi phí âm, recurrence interval không hợp lệ và recurrence end date sai.
- Nút Start chỉ khả dụng trong khung thời gian hợp lệ.

## 7. Phòng lab và thiết bị

- Khi API list không có `imageUrl`, frontend lấy ảnh từ API detail của các card trong trang hiện tại và vẫn có fallback an toàn.
- Không còn icon ảnh vỡ.
- Chỉ hiển thị LabManager đang Active trong dropdown tạo/đổi quản lý phòng.
- Bổ sung kiểm tra dữ liệu bắt buộc trước khi tạo/sửa phòng và thiết bị.

## 8. Usage log, Incident và Violation

- Các filter tìm kiếm, trạng thái và ngày cập nhật ngay.
- Checkout thủ công phải sau check-in và không được ở tương lai.
- Tìm user khi tạo violation bằng API search, không còn giới hạn cố định 100 user đầu tiên.
- Xác minh Booking ID thuộc đúng user trước khi tạo violation.
- Các thao tác quan trọng hiển thị message backend rõ hơn.

## 9. Khả năng chịu lỗi API

Đã thêm fallback độc lập cho API phụ tại:

- Chi tiết user.
- Chi tiết booking.
- Calendar.
- Reports.

Một API phụ lỗi không còn làm hỏng toàn bộ màn hình. Reports vẫn hiển thị phần tải được và báo số API gặp lỗi.

## 10. Hiệu năng và UX

- Đổi `PreloadAllModules` thành `NoPreloading`, giảm tải ban đầu của ứng dụng 37 màn hình.
- Debounce tìm người dùng ở màn hình thông báo/vi phạm.
- Chặn response cũ ghi đè danh sách khi filter đổi nhanh.
- MutationObserver dịch giao diện được gom theo animation frame thay vì xử lý từng mutation ngay lập tức.
- 403 từ một API phụ không còn tự động đẩy toàn trang sang `/403`; route guard vẫn bảo vệ route theo role.
- Pagination thông báo dùng kỹ thuật tải `pageSize + 1` để xác định chính xác trang tiếp theo.

## Kiểm tra kỹ thuật

- TypeScript semantic check (`tsc --noEmit`): **PASS**.
- Angular template compiler (`ngc`): **PASS**.
- Kiểm tra cú pháp 75 file TypeScript: **PASS**.
- Translation JSON: **PASS**.
- Không còn class Tailwind `bg-gradient-to-*`: **PASS**.
- Không còn mojibake tiếng Việt: **PASS**.
- Không có `.js` sinh nhầm trong `src`: **PASS**.
- Không đóng gói `node_modules`, `dist`, `.angular`: **PASS**.

## Lưu ý build

Môi trường kiểm tra đã chạy thành công TypeScript compiler và Angular template compiler. Full bundle `ng build` không được tạo tại môi trường này vì registry nội bộ trả lỗi HTTP 503 khi tải native package Linux. Trên máy Windows dùng Node 24.18, chạy `npm.cmd ci` rồi `npm.cmd run build` để cài đúng native package Windows.
