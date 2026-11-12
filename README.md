# TULO COFFEE – Full-Stack Web Application (PROG2008)

Ứng dụng Web quản lý & đặt món cho quán cà phê **Tulo Coffee**, gồm:
- **Frontend:** HTML5, CSS3 (Light/Dark Mode, Responsive), JavaScript kết nối RESTful API (`index.html`, `menu.html`, `quanly.html`).
- **Backend:** Node.js + Express + SQL Server (`backend/`), xác thực JWT + bcrypt, phân tầng chuẩn công nghiệp.

## Chạy nhanh dự án

### 1. Khởi tạo Database (SQL Server)
Chạy lần lượt 2 file SQL trong `backend/database/`:
```powershell
sqlcmd -S ".\SQLEXPRESS" -E -C -f 65001 -i backend\database\schema.sql
sqlcmd -S ".\SQLEXPRESS" -E -C -f 65001 -i backend\database\seed.sql
```

### 2. Chạy Backend API
```powershell
cd backend
npm install
npm run dev
```
Server chạy tại `http://localhost:5000/api/health`.

### 3. Mở Frontend
Mở `index.html`, `menu.html`, hoặc `quanly.html` bằng **VS Code Live Server** (hoặc mở trực tiếp trên trình duyệt).

### 4. Tài khoản Demo
- **Admin:** `admin` / `Admin@123`
- **Khách hàng:** `khachhang1` / `User@123`

### 5. Chạy Test tự động
```powershell
cd backend
npm test
```

Xem chi tiết kiến trúc, ERD, danh sách 30 API endpoints và 20 câu hỏi vấn đáp tại [`backend/README.md`](backend/README.md).

