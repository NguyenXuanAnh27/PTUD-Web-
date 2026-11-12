# Tulo Coffee – Backend RESTful API (PROG2008)

Hệ thống Backend & Cơ sở dữ liệu cho **Hệ thống Quản lý Quán Cà phê Tulo Coffee**, xây dựng theo kiến trúc phân tầng với **Node.js + Express + SQL Server (`mssql`)**.

## Công nghệ sử dụng
- **Runtime & Framework:** Node.js, Express.js
- **Database:** Microsoft SQL Server (6 bảng chuẩn 3NF: `Users`, `TokenBlacklist`, `Categories`, `Products`, `Orders`, `OrderDetails`)
- **Xác thực & Bảo mật:** JWT (`jsonwebtoken`), `bcryptjs` (salt rounds = 10), `helmet`, `cors`, `express-rate-limit`, `express-validator`
- **Kiểm thử:** Jest + Supertest, REST Client (`tests/api.http`), Postman (`tests/postman_collection.json`)

## Cấu trúc thư mục
```text
backend/
├─ src/
│  ├─ config/          # env.js, db.js
│  ├─ routes/          # auth, user, category, product, order, statistic
│  ├─ controllers/     # Tiếp nhận request & trả JSON chuẩn
│  ├─ services/        # Xử lý nghiệp vụ, ownership, phân trang
│  ├─ repositories/    # Truy vấn SQL Server tham số hóa (@param) & Transaction
│  ├─ middlewares/     # authenticate, authorize, validate, errorHandler, notFound
│  ├─ validators/      # express-validator schemas
│  ├─ utils/           # ApiError, asyncHandler, responseHelper, pagination
│  ├─ app.js
│  └─ server.js
├─ database/
│  ├─ schema.sql       # Tạo CSDL, bảng, PK/FK, CHECK, INDEX
│  └─ seed.sql         # Dữ liệu mẫu (3 users, 4 danh mục, 16 món, 10 đơn hàng)
├─ docs/               # ERD.md, UseCase.md, ARCHITECTURE.md, API.md, CHECKLIST_RUBRIC.md, QA_VAN_DAP.md
├─ tests/              # api.test.js, api.http, postman_collection.json
├─ .env.example
├─ .gitignore
└─ package.json
```

## Hướng dẫn cài đặt & chạy trên máy mới

### Bước 1: Tạo Cơ sở dữ liệu SQL Server
Mở **SQL Server Management Studio (SSMS)** hoặc dùng `sqlcmd`, chạy lần lượt 2 file:
1. `database/schema.sql` (tạo DB `TuloCoffeeDB` và 6 bảng)
2. `database/seed.sql` (nạp dữ liệu mẫu)

Hoặc chạy qua terminal (`sqlcmd`):
```powershell
sqlcmd -S ".\SQLEXPRESS" -E -C -f 65001 -i database\schema.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -f 65001 -i database\seed.sql
```

### Bước 2: Cấu hình biến môi trường
Copy file `.env.example` thành `.env` và chỉnh thông tin kết nối SQL Server của máy bạn:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=1433
DB_NAME=TuloCoffeeDB
DB_USER=sa
DB_PASSWORD=your_password
JWT_SECRET=chuoi_bi_mat_it_nhat_32_ky_tu
```
*(Nếu dùng SQL Server Express với Windows Authentication trên máy cục bộ, đặt `DB_HOST=.`, `DB_INSTANCE=SQLEXPRESS`, `DB_TRUSTED_CONNECTION=true` và cài `msnodesqlv8`).*

### Bước 3: Cài đặt thư viện & Khởi chạy
```bash
cd backend
npm install
npm run dev
```
Server mặc định chạy tại: `http://localhost:5000/api/health`

### Bước 4: Chạy bộ kiểm thử tự động
```bash
npm test
```

## Tài khoản Demo (có sẵn trong `seed.sql`)
| Vai trò | Username | Email | Mật khẩu |
|---------|----------|-------|----------|
| **Admin** | `admin` | `admin@tulocoffee.vn` | `Admin@123` |
| **Customer 1** | `khachhang1` | `khach1@tulocoffee.vn` | `User@123` |
| **Customer 2** | `khachhang2` | `khach2@tulocoffee.vn` | `User@123` |

## Tài liệu kèm theo
- [Tài liệu API (30 Endpoints)](docs/API.md)
- [Sơ đồ ERD](docs/ERD.md)
- [Sơ đồ Use Case](docs/UseCase.md)
- [Kiến trúc hệ thống & Luồng JWT](docs/ARCHITECTURE.md)
- [Bảng đối chiếu Rubric](docs/CHECKLIST_RUBRIC.md)
- [20 Câu hỏi vấn đáp](docs/QA_VAN_DAP.md)
