# Kiến trúc Hệ thống Backend – Tulo Coffee

## 1. Kiến trúc phân tầng (Layered Architecture)

Backend được thiết kế theo mô hình **4 tầng tách biệt rõ ràng**, mỗi tầng đảm nhận một trách nhiệm duy nhất:

```mermaid
flowchart TB
    Client["Client (Frontend / Postman / REST Client)"]
    MW["Middlewares<br/>(helmet, cors, morgan, rateLimit, authenticate, authorize, validate)"]
    Routes["Routes Layer<br/>(src/routes/*.routes.js)"]
    Controllers["Controllers Layer<br/>(src/controllers/*.controller.js)"]
    Services["Services Layer<br/>(src/services/*.service.js)"]
    Repos["Repositories Layer<br/>(src/repositories/*.repository.js)"]
    DB[("SQL Server<br/>TuloCoffeeDB")]
    Err["Central Error Handler<br/>(src/middlewares/errorHandler.js)"]

    Client -->|"HTTP JSON Request"| MW
    MW --> Routes
    Routes --> Controllers
    Controllers -->|"Gọi nghiệp vụ"| Services
    Services -->|"Transaction / Business Rules"| Repos
    Repos -->|"Parameterized SQL (@param)"| DB
    DB -->|"Recordsets"| Repos
    Repos --> Services
    Services --> Controllers
    Controllers -->|"JSON Response chuẩn"| Client
    MW -.->|"ApiError / Lỗi validate"| Err
    Controllers -.->|"asyncHandler -> next(err)"| Err
    Err -.->|"JSON Error (không lộ stack)"| Client
```

## 2. Vai trò từng tầng
- **Routes (`src/routes/`)**: Định nghĩa đường dẫn RESTful, gắn rate limiter, `authenticate`, `authorize(...roles)` và `validate`.
- **Validators (`src/validators/`)**: Khai báo luật kiểm tra dữ liệu đầu vào bằng `express-validator` trước khi vào Controller.
- **Controllers (`src/controllers/`)**: Nhận `req`, gọi Service tương ứng, đóng gói kết quả theo chuẩn `{ success, message, data }`.
- **Services (`src/services/`)**: Chứa toàn bộ logic nghiệp vụ (băm mật khẩu, sinh JWT, kiểm tra trùng lặp, kiểm tra ownership, tự sinh mã món, tính tổng hợp thống kê).
- **Repositories (`src/repositories/`)**: Thực thi câu lệnh SQL qua thư viện `mssql` với **Parameterized Queries** (`@param`) và quản lý **SQL Transaction** (tạo đơn hàng + chi tiết đơn).
- **Middlewares (`src/middlewares/`)**: Xử lý cắt ngang (xác thực JWT, kiểm tra blacklist token, phân quyền RBAC, bắt 404, xử lý lỗi tập trung).

## 3. Luồng xác thực & phân quyền JWT

```mermaid
sequenceDiagram
    actor User
    participant API as Express API
    participant AuthMW as authenticate & authorize
    participant Service as auth.service / order.service
    participant DB as SQL Server

    User->>API: POST /api/auth/login { usernameOrEmail, password }
    API->>Service: login()
    Service->>DB: SELECT User WHERE Username = @u OR Email = @u
    DB-->>Service: User + PasswordHash
    Service->>Service: bcrypt.compare(password, PasswordHash)
    Service->>Service: jwt.sign({ id, role }, JWT_SECRET)
    Service-->>User: 200 { success: true, data: { token, user } }

    Note over User,DB: Request cần bảo vệ (VD: POST /api/orders hoặc GET /api/statistics/overview)

    User->>API: Request + Header "Authorization: Bearer <token>"
    API->>AuthMW: authenticate()
    AuthMW->>DB: Kiểm tra TokenBlacklist & User.IsActive
    AuthMW->>AuthMW: jwt.verify(token, JWT_SECRET) -> gắn req.user
    AuthMW->>AuthMW: authorize(...roles) kiểm tra req.user.role
    alt Hợp lệ & đúng quyền
        AuthMW->>API: next() -> thực thi Controller -> DB
        API-->>User: 200 / 201 JSON Response
    else Thiếu/sai token hoặc token đã logout
        AuthMW-->>User: 401 Unauthorized
    else Đúng token nhưng sai vai trò
        AuthMW-->>User: 403 Forbidden
    end
```

