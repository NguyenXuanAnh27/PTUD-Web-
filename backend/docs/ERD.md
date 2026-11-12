# Sơ đồ Thực thể Kết hợp (ERD) – Tulo Coffee

Hệ thống sử dụng **6 bảng** trong SQL Server (`TuloCoffeeDB`), chuẩn hóa đạt chuẩn **3NF** với đầy đủ khóa chính (`PK`), khóa ngoại (`FK`), ràng buộc toàn vẹn (`UNIQUE`, `CHECK`, `DEFAULT`, `NOT NULL`) và chỉ mục (`INDEX`).

```mermaid
erDiagram
    Users {
        INT Id PK "Khóa chính, tự tăng"
        NVARCHAR Username UK "Tên đăng nhập (UNIQUE)"
        NVARCHAR Email UK "Email (UNIQUE)"
        NVARCHAR PasswordHash "Mật khẩu đã băm bcrypt"
        NVARCHAR FullName "Họ và tên"
        NVARCHAR Phone "Số điện thoại"
        NVARCHAR Role "admin / customer"
        BIT IsActive "1 = hoạt động, 0 = bị khóa"
        DATETIME2 CreatedAt "Ngày tạo"
        DATETIME2 UpdatedAt "Ngày cập nhật"
    }

    TokenBlacklist {
        INT Id PK "Khóa chính, tự tăng"
        NVARCHAR Token UK "JWT đã đăng xuất"
        DATETIME2 ExpiresAt "Thời điểm token hết hạn"
        DATETIME2 CreatedAt "Ngày thu hồi"
    }

    Categories {
        INT Id PK "Khóa chính, tự tăng"
        NVARCHAR Name UK "Tên danh mục"
        NVARCHAR Code UK "Mã viết tắt (CF, TR, ST, BA)"
        NVARCHAR Description "Mô tả danh mục"
        INT SortOrder "Thứ tự hiển thị"
        BIT IsActive "1 = hiển thị, 0 = ẩn"
        DATETIME2 CreatedAt "Ngày tạo"
    }

    Products {
        INT Id PK "Khóa chính, tự tăng"
        NVARCHAR Code UK "Mã sản phẩm (CF001, TR001...)"
        NVARCHAR Name "Tên món"
        INT CategoryId FK "Tham chiếu Categories.Id"
        INT Price "Giá bán (VNĐ), > 0"
        NVARCHAR Status "available / out_of_stock"
        NVARCHAR Image "URL hình ảnh"
        NVARCHAR Description "Mô tả hương vị"
        BIT IsDeleted "Xóa mềm: 0 = còn, 1 = đã xóa"
        DATETIME2 CreatedAt "Ngày tạo"
        DATETIME2 UpdatedAt "Ngày cập nhật"
    }

    Orders {
        INT Id PK "Khóa chính, tự tăng"
        INT UserId FK "Tham chiếu Users.Id"
        NVARCHAR OrderCode UK "Mã đơn hàng (ORD-...)"
        INT TotalAmount "Tổng tiền (VNĐ)"
        NVARCHAR Status "pending / confirmed / completed / cancelled"
        NVARCHAR Note "Ghi chú của khách"
        NVARCHAR CustomerName "Tên người nhận"
        NVARCHAR CustomerPhone "SĐT người nhận"
        DATETIME2 CreatedAt "Ngày đặt"
        DATETIME2 UpdatedAt "Ngày cập nhật"
    }

    OrderDetails {
        INT Id PK "Khóa chính, tự tăng"
        INT OrderId FK "Tham chiếu Orders.Id"
        INT ProductId FK "Tham chiếu Products.Id"
        INT Quantity "Số lượng (> 0)"
        INT UnitPrice "Đơn giá tại thời điểm đặt"
        INT Subtotal "Cột tính toán = Quantity * UnitPrice"
    }

    Categories ||--o{ Products : "phân loại"
    Users ||--o{ Orders : "đặt"
    Orders ||--|{ OrderDetails : "gồm"
    Products ||--o{ OrderDetails : "được đặt trong"
```

## Giải thích chuẩn hóa 3NF & thiết kế dữ liệu
1. **Tách `Categories` khỏi `Products`**: Nếu thay đổi tên danh mục, chỉ cần sửa 1 dòng trong `Categories`, không bị dư thừa dữ liệu hay bất thường cập nhật.
2. **Tách `OrderDetails` khỏi `Orders`**: Một đơn hàng có nhiều món (quan hệ N-N giữa `Orders` và `Products`), tách thành bảng trung gian `OrderDetails` với `UnitPrice` lưu lại giá bán tại thời điểm đặt hàng để không bị sai lệch doanh thu lịch sử nếu Admin sửa giá món về sau.
3. **Xóa mềm (`IsDeleted`) trên `Products`**: Đảm bảo các đơn hàng cũ đã đặt món đó không bị lỗi khóa ngoại hoặc mất dữ liệu thống kê khi Admin xóa món khỏi thực đơn.
4. **Bảng `TokenBlacklist`**: Lưu trữ JWT đã đăng xuất để vô hiệu hóa phiên ngay lập tức khi người dùng gọi `POST /api/auth/logout`.

