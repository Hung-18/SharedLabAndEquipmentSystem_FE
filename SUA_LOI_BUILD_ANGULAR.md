# SỬA LỖI BUILD ANGULAR

Bản này đã sửa các lỗi Angular compiler được phát hiện khi chạy `npm start`.

## Các lỗi đã sửa

1. `src/app/features/admin/departments.page.ts`
   - Chuẩn hóa biến request thành `Observable<unknown>`.
   - Sửa lỗi TS2349 khi gọi `subscribe()` trên union Observable.

2. `src/app/features/admin/priority-rules.page.ts`
   - Chuẩn hóa biến request thành `Observable<unknown>`.
   - Sửa lỗi TS2349 khi gọi `subscribe()` trên union Observable.

3. `src/app/features/management/maintenance-detail.page.ts`
   - Xóa dấu `}` thừa ở cuối template.
   - Sửa lỗi NG5002 `Unexpected closing block`.

4. `src/app/features/management/pending-bookings.page.ts`
   - Xóa dấu `}` thừa trong block `@for` / `@else`.
   - Sửa lỗi NG5002 và lỗi đóng thẻ `div` ngoài thứ tự.

5. Dọn warning import không sử dụng tại:
   - `src/app/features/admin/send-notification.page.ts`
   - `src/app/features/dashboard/dashboard.page.ts`
   - `src/app/features/requester/my-violations.page.ts`

## Kiểm tra đã thực hiện

- Kiểm tra cú pháp toàn bộ file TypeScript bằng TypeScript parser.
- Kiểm tra cân bằng block `@if`, `@else`, `@for`, `@empty` trong toàn bộ inline template.
- Kiểm tra file ZIP sau khi đóng gói.

## Chạy project

```bash
npm ci
npm start
```

Không cần chạy `npm audit fix --force` để khởi động project.
