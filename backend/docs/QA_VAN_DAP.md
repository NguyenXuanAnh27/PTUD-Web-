# 20 Câu Hỏi Vấn Đáp Backend Thường Gặp – Tulo Coffee (PROG2008)

### 1. Kiến trúc Backend của nhóm tổ chức theo mô hình gì?
Theo mô hình phân tầng (**Layered Architecture**): `Routes → Validators → Controllers → Services → Repositories → SQL Server`. Cách tách này giúp code dễ bảo trì, mỗi tầng làm đúng một việc, không viết lẫn lộn SQL trong route hay controller.

### 2. JWT hoạt động như thế nào trong dự án?
Khi đăng nhập (`POST /api/auth/login`), server kiểm tra username/password, rồi ký một JWT chứa `{ id, role }` bằng `JWT_SECRET` (trong `src/services/auth.service.js`). Các request sau gửi kèm header `Authorization: Bearer <token>`, middleware `authenticate` giải mã và kiểm tra người dùng trước khi cho đi tiếp.

### 3. Làm sao xử lý chức năng Đăng xuất khi JWT là stateless?
Khi gọi `POST /api/auth/logout`, server lấy token hiện tại lưu vào bảng `TokenBlacklist` trong SQL Server (hàm `blacklistToken` ở `user.repository.js`). Trong middleware `authenticate.js`, trước khi verify token, hệ thống kiểm tra `isTokenBlacklisted(token)` — nếu có sẽ trả về `401`.

### 4. Vì sao không lưu mật khẩu dạng plain text mà phải dùng `bcrypt`?
Nếu DB bị lộ, hacker vẫn không đọc được mật khẩu gốc vì bcrypt là hàm băm một chiều (one-way hash) kèm **salt** ngẫu nhiên (`SALT_ROUNDS = 10`), chống tấn công rainbow table và brute-force.

### 5. Sự khác biệt giữa HTTP status `401` và `403` trong code của nhóm là gì?
- **`401 Unauthorized`** (ở `authenticate.js`): Chưa đăng nhập, thiếu token, token sai/hết hạn hoặc đã logout.
- **`403 Forbidden`** (ở `authorize.js` hoặc ownership check trong `order.service.js`): Đã đăng nhập hợp lệ nhưng không đủ quyền (VD: `customer` gọi API thống kê của `admin`, hoặc xem đơn hàng của người khác).

### 6. Nhóm chống SQL Injection bằng cách nào?
Mọi truy vấn ở `src/repositories/` đều sử dụng **Parameterized Query** qua `.input('paramName', sql.Type, value)` của thư viện `mssql`, tuyệt đối không nối chuỗi input người dùng vào câu SQL. Riêng phần `ORDER BY` ở `product.repository.js` dùng **whitelist** (`SORT_MAP`), nếu client truyền giá trị lạ sẽ fallback về mặc định.

### 7. Vì sao không tin tưởng `totalAmount` hoặc `unitPrice` do Frontend gửi lên khi đặt hàng?
Vì người dùng có thể dùng Postman/DevTools sửa giá xuống 0 đồng. Do đó trong `order.repository.js`, server tự truy vấn giá hiện hành từ bảng `Products` trong DB rồi tính `TotalAmount` và `UnitPrice`.

### 8. Transaction được dùng ở đâu và có tác dụng gì?
Dùng trong hàm `createOrderWithDetails` (`src/repositories/order.repository.js`) khi tạo đơn hàng: kiểm tra món → `INSERT Orders` → vòng lặp `INSERT OrderDetails`. Nếu bất kỳ món nào hết hàng hoặc lỗi DB, khối `catch` sẽ gọi `transaction.rollback()` để không sinh ra đơn hàng rỗng thiếu chi tiết.

### 9. Tại sao dùng xóa mềm (`IsDeleted`) cho Products thay vì `DELETE` cứng?
Vì bảng `OrderDetails` có khóa ngoại tham chiếu `Products(Id)`. Nếu xóa cứng sẽ lỗi ràng buộc FK hoặc làm mất lịch sử doanh thu các đơn hàng cũ. Xóa mềm chỉ đánh dấu `IsDeleted = 1` và các API danh sách lọc `WHERE p.IsDeleted = 0`.

### 10. Kiểm tra quyền sở hữu (Ownership check) được thực hiện ở đâu?
Ở `src/services/order.service.js` trong hàm `getOrderById` và `cancelMyOrder`: nếu `currentUser.role !== 'admin' && order.UserId !== currentUser.id`, hệ thống ném lỗi `ApiError(403)`.

### 11. Vì sao khi đăng ký tài khoản luôn gán `role = 'customer'` trên server?
Để ngăn lỗ hổng **Mass Assignment / Privilege Escalation**: ngay cả khi hacker cố tình gửi `"role": "admin"` trong JSON body của `/api/auth/register`, service vẫn bỏ qua và gán `'customer'`.

### 12. CSDL của nhóm đạt chuẩn hóa mấy (Normal Form)? Hãy chứng minh.
Đạt **3NF**: tách `Categories` ra khỏi `Products` (tránh lặp tên/mô tả danh mục), tách `OrderDetails` khỏi `Orders` (tránh lặp thông tin đơn cho mỗi món, không có phụ thuộc bắc cầu).

### 13. Tại sao trong `OrderDetails` lại lưu cột `UnitPrice` khi bảng `Products` đã có `Price`?
Để lưu **snapshot giá tại thời điểm mua**. Nếu tháng sau quán tăng giá Cà phê từ 29.000đ lên 35.000đ, các hóa đơn cũ vẫn giữ nguyên số tiền đúng đã thanh toán.

### 14. Phân trang được xử lý ở DB hay ở JS?
Xử lý trực tiếp tại **SQL Server** bằng `OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY` kết hợp một truy vấn `COUNT(*)`, giúp không phải tải toàn bộ bảng vào RAM khi dữ liệu lớn.

### 15. Xử lý lỗi tập trung (`errorHandler`) hoạt động ra sao?
Mọi controller đều bọc trong `asyncHandler`, khi có lỗi (chủ động ném `ApiError` hoặc lỗi SQL/JWT) sẽ tự đẩy về `src/middlewares/errorHandler.js`. Middleware này chuyển mã lỗi SQL (như `2627` trùng khóa → `409`, `547` khóa ngoại → `400`) thành JSON thống nhất và **không bao giờ** trả stack trace hay thông tin DB ra client.

### 16. Validation phía Server dùng thư viện gì và trả lỗi thế nào?
Dùng `express-validator` trong thư mục `src/validators/` kết hợp middleware `src/middlewares/validate.js`. Nếu có lỗi sẽ dừng trước Controller và trả HTTP `400` kèm mảng `errors: [{ field, message }]`.

### 17. Các biện pháp bảo mật bổ sung đã áp dụng là gì?
`helmet` (bảo vệ HTTP headers), `cors` (giới hạn origin được gọi API), `express-rate-limit` (chống brute-force ở `/api/auth/login`), lưu secrets trong `.env` (không commit lên Git nhờ `.gitignore`).

### 18. Chức năng tìm kiếm hoạt động trên những trường nào?
Trên `GET /api/products?keyword=...`, hệ thống tìm trên **3 trường**: `Name` (tên món), `Code` (mã món) và `Description` (mô tả), kết hợp được cùng lúc với lọc `?category=`, `?status=`, khoảng giá `?minPrice=&maxPrice=` và phân trang `?page=&limit=`.

### 19. API thống kê dùng dữ liệu thật như thế nào?
5 API trong `/api/statistics/*` đều truy vấn trực tiếp bảng `Orders`, `OrderDetails`, `Products`, `Categories` bằng các hàm SQL tổng hợp `SUM()`, `COUNT()`, `AVG()`, `GROUP BY` (doanh thu theo tháng, số đơn theo ngày, top món bán chạy, phân bổ danh mục).

### 20. Làm sao chạy lại toàn bộ dự án trên máy mới từ đầu?
Clone repo → chạy `database/schema.sql` rồi `database/seed.sql` trong SQL Server → copy `.env.example` thành `.env` và điền thông tin kết nối DB + `JWT_SECRET` → chạy `npm install && npm run dev` → chạy `npm test` để xác minh.

