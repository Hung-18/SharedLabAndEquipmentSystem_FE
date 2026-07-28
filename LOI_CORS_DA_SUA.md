# Lỗi CORS đã sửa

## Nguyên nhân

Frontend trước đây gọi trực tiếp:

```text
http://localhost:5253/api/Auth/login
```

Trong backend có `app.UseHttpsRedirection()`, nên request `OPTIONS` kiểm tra CORS bị chuyển hướng sang HTTPS. Trình duyệt không cho phép redirect đối với preflight request nên báo:

```text
Redirect is not allowed for a preflight request
```

## Cách sửa trong bản này

Frontend gọi `/api` cùng origin với Angular. Angular dev server proxy request tới:

```text
https://localhost:7073
```

Các file đã sửa/thêm:

- `src/environments/environment.development.ts`
- `angular.json`
- `proxy.conf.json`

## Cách chạy

1. Chạy backend bằng profile `https`.
2. Kiểm tra Swagger mở được tại `https://localhost:7073/swagger`.
3. Chạy frontend:

```bash
npm ci
npm start
```

4. Mở `http://localhost:4200`.

Trong Network, request đăng nhập sẽ có URL dạng:

```text
http://localhost:4200/api/Auth/login
```

Angular sẽ tự chuyển tiếp request đó tới backend.
