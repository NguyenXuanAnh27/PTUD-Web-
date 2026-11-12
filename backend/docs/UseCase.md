# Biểu đồ & Danh sách Use Case – Tulo Coffee

Hệ thống phân chia thành **2 vai trò chính**:
- **Khách hàng (`customer`)**: Đăng ký, đăng nhập, quản lý hồ sơ, xem thực đơn, đặt hàng, theo dõi và hủy đơn chờ xử lý.
- **Quản trị viên (`admin`)**: Toàn quyền quản lý thực đơn, danh mục, đơn hàng, người dùng và xem báo cáo thống kê.

```mermaid
flowchart LR
    Guest(["Khách vãng lai"])
    Customer(["Khách hàng (customer)"])
    Admin(["Quản trị viên (admin)"])

    subgraph Auth["Xác thực & Tài khoản"]
        UC1["Đăng ký tài khoản"]
        UC2["Đăng nhập (JWT)"]
        UC3["Đăng xuất (Blacklist Token)"]
        UC4["Xem & Cập nhật hồ sơ"]
        UC5["Đổi mật khẩu"]
    end

    subgraph Menu["Thực đơn & Danh mục"]
        UC6["Xem thực đơn (Tìm kiếm, Lọc, Phân trang)"]
        UC7["Xem chi tiết món"]
        UC8["Quản lý danh mục (CRUD)"]
        UC9["Quản lý sản phẩm (CRUD, Xóa mềm)"]
    end

    subgraph Order["Đơn hàng"]
        UC10["Đặt đơn hàng (SQL Transaction)"]
        UC11["Xem lịch sử đơn hàng của mình"]
        UC12["Hủy đơn hàng của mình (khi pending)"]
        UC13["Xem toàn bộ đơn & Cập nhật trạng thái"]
    end

    subgraph AdminMgmt["Quản trị & Thống kê"]
        UC14["Quản lý người dùng (Danh sách, Khóa/Mở, Đổi role)"]
        UC15["Thống kê tổng quan & Doanh thu theo tháng"]
        UC16["Thống kê đơn theo ngày, Top món, Danh mục"]
    end

    Guest --> UC1
    Guest --> UC2
    Guest --> UC6
    Guest --> UC7

    Customer --> UC2
    Customer --> UC3
    Customer --> UC4
    Customer --> UC5
    Customer --> UC6
    Customer --> UC7
    Customer --> UC10
    Customer --> UC11
    Customer --> UC12

    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC8
    Admin --> UC9
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
```

