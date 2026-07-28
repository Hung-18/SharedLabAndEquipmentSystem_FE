# KIỂM TRA KỸ THUẬT TRƯỚC KHI ĐÓNG GÓI

Các bước đã chạy trên source:

- Kiểm tra toàn bộ import tương đối: không có file import bị thiếu.
- Kiểm tra TypeScript bằng cấu hình strict và declaration stub cho Angular/RxJS: không còn lỗi TypeScript nội bộ.
- Kiểm tra 46 standalone component và dependency template: RouterLink, FormsModule, NgClass, DatePipe, DecimalPipe và component con đều được import khi sử dụng.
- Kiểm tra cấu trúc HTML của toàn bộ inline template: không có thẻ đóng/mở sai.
- Kiểm tra icon literal: mọi icon được dùng đều có SVG case tương ứng.
- Kiểm tra JSON: `package.json`, `package-lock.json`, `angular.json`, `proxy.conf.json`, tsconfig và environment hợp lệ.
- Kiểm tra route: có đầy đủ mapping MH-01 đến MH-37, thêm route dùng chung cho create/edit và landing.
- Đối chiếu endpoint frontend với 16 controller của backend.
- Giữ proxy `/api -> https://localhost:7073` để xử lý CORS local.

## Giới hạn kiểm tra trong môi trường đóng gói

Môi trường tạo file không phân giải được DNS `registry.npmjs.org`, vì vậy không thể tải `node_modules` để chạy trọn vẹn `ng build`. Source không kèm `node_modules`; hãy chạy:

```bash
npm ci
npm run build
```

trên máy có Internet để thực hiện bước Angular compiler/bundle cuối cùng.
