# FIX QUÊN MẬT KHẨU – SPINNER KHÔNG DỪNG

## Nguyên nhân

Project đang chạy theo cơ chế change detection không phụ thuộc hoàn toàn vào Zone.js. Các trạng thái `loading`, `sent` và `errorMessage` trước đây là biến thường. Khi `setTimeout()` chạy trong lúc API SMTP còn chờ, giao diện không được cập nhật nên nút tiếp tục hiển thị spinner.

## Đã sửa

- Chuyển trạng thái của màn hình quên mật khẩu sang Angular `signal()`.
- Spinner chỉ hiển thị tối đa khoảng 0,9 giây.
- Nếu SMTP phản hồi chậm, giao diện tự chuyển sang trạng thái “Kiểm tra hộp thư”.
- Request gửi email dùng `fetch(..., { keepalive: true })`, nên bấm “Mở Gmail trong tab này” không làm hủy request đang gửi.
- Nếu backend lỗi ngay, giao diện hiển thị lỗi và không báo thành công giả.
- Nếu lỗi đến muộn sau khi request đã được tiếp nhận, giao diện vẫn giữ hướng dẫn kiểm tra email và hiển thị cảnh báo để người dùng có thể gửi lại.
- Giữ nguyên chuyển đổi ngôn ngữ VI/EN.

## Kiểm tra

- TypeScript `tsc --noEmit`: PASS.
- Angular template compiler `ngc --noEmit`: PASS.
- File ZIP không chứa `node_modules`, `dist` hoặc `.angular`.
