-- ============================================================================
-- TULO COFFEE - DỮ LIỆU MẪU (SEED DATA)
-- Chạy sau file schema.sql
-- Tài khoản demo:
--   Admin:     admin / Admin@123
--   Customer1: khachhang1 / User@123
--   Customer2: khachhang2 / User@123
-- ============================================================================

USE TuloCoffeeDB;
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================================
-- 1. SEED USERS (Mật khẩu đã băm bằng bcrypt salt rounds = 10)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Username = N'admin')
BEGIN
    INSERT INTO dbo.Users (Username, Email, PasswordHash, FullName, Phone, Role, IsActive)
    VALUES (
        N'admin',
        N'admin@tulocoffee.vn',
        N'$2a$10$om0lcWkc92o/W1u06YF8X.0oPNmLuRi2UUeFeBKYM8UrehTDizMqG',
        N'Quản Trị Viên Tulo',
        N'0909123456',
        N'admin',
        1
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Username = N'khachhang1')
BEGIN
    INSERT INTO dbo.Users (Username, Email, PasswordHash, FullName, Phone, Role, IsActive)
    VALUES (
        N'khachhang1',
        N'khach1@tulocoffee.vn',
        N'$2a$10$NxVUZZWGhTht2SGOJzGpiuq5LHf9IzPRwObO8ghUHXjmaHs5/zMWy',
        N'Nguyễn Minh Anh',
        N'0912345678',
        N'customer',
        1
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Username = N'khachhang2')
BEGIN
    INSERT INTO dbo.Users (Username, Email, PasswordHash, FullName, Phone, Role, IsActive)
    VALUES (
        N'khachhang2',
        N'khach2@tulocoffee.vn',
        N'$2a$10$NxVUZZWGhTht2SGOJzGpiuq5LHf9IzPRwObO8ghUHXjmaHs5/zMWy',
        N'Trần Hoàng Nam',
        N'0987654321',
        N'customer',
        1
    );
END
GO

-- ============================================================================
-- 2. SEED CATEGORIES (4 Danh mục chính)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE Code = N'CF')
    INSERT INTO dbo.Categories (Name, Code, Description, SortOrder) VALUES (N'Cà phê', N'CF', N'Cà phê rang mộc nguyên bản Đắk Lắk và Cầu Đất', 1);

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE Code = N'TR')
    INSERT INTO dbo.Categories (Name, Code, Description, SortOrder) VALUES (N'Trà', N'TR', N'Trà hoa quả tươi mát và trà thảo mộc', 2);

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE Code = N'ST')
    INSERT INTO dbo.Categories (Name, Code, Description, SortOrder) VALUES (N'Sinh tố', N'ST', N'Sinh tố trái cây nhiệt đới bổ dưỡng', 3);

IF NOT EXISTS (SELECT 1 FROM dbo.Categories WHERE Code = N'BA')
    INSERT INTO dbo.Categories (Name, Code, Description, SortOrder) VALUES (N'Bánh', N'BA', N'Bánh ngọt nướng tươi mỗi ngày', 4);
GO

-- ============================================================================
-- 3. SEED PRODUCTS (16 món thực đơn)
-- ============================================================================
DECLARE @CatCF INT = (SELECT Id FROM dbo.Categories WHERE Code = N'CF');
DECLARE @CatTR INT = (SELECT Id FROM dbo.Categories WHERE Code = N'TR');
DECLARE @CatST INT = (SELECT Id FROM dbo.Categories WHERE Code = N'ST');
DECLARE @CatBA INT = (SELECT Id FROM dbo.Categories WHERE Code = N'BA');

IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE Code = N'CF001')
INSERT INTO dbo.Products (Code, Name, CategoryId, Price, Status, Image, Description) VALUES
(N'CF001', N'Cà Phê Phin Sữa Đá', @CatCF, 29000, N'available', N'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80', N'Cà phê Robusta Đắk Lắk pha phin truyền thống hòa quyện cùng sữa đặc béo ngậy chuẩn gu Sài Gòn.'),
(N'CF002', N'Bạc Xỉu Sài Gòn', @CatCF, 32000, N'available', N'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80', N'Sự kết hợp tinh tế giữa ba tầng: sữa tươi, sữa đặc ngọt dịu và lớp cà phê thơm lừng phía trên.'),
(N'CF003', N'Cà Phê Muối Cố Đô', @CatCF, 35000, N'available', N'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80', N'Vị đắng đượm của cà phê phin kết hợp lớp kem muối béo mặn độc đáo, đánh thức mọi giác quan.'),
(N'CF004', N'Espresso Macchiato', @CatCF, 39000, N'available', N'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80', N'Chiết xuất hạt Arabica Cầu Đất nguyên chất phủ một chấm bọt sữa nóng mịn màng chuẩn phong cách Ý.'),
(N'CF005', N'Cold Brew Cam Vàng', @CatCF, 45000, N'available', N'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=600&q=80', N'Cà phê ủ lạnh 18 giờ kết hợp cam vàng tươi thanh mát, hậu vị ngọt tự nhiên.'),
(N'TR001', N'Trà Đào Cam Sả', @CatTR, 39000, N'available', N'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80', N'Trà thanh dịu thơm ngát hương sả tươi kết hợp cùng những lát đào giòn ngọt và vị cam thanh mát.'),
(N'TR002', N'Trà Sen Vàng Kem Cheese', @CatTR, 45000, N'available', N'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80', N'Nước cốt trà ô long ướp hạt sen bùi béo, điểm xuyết củ năng giòn rụm và lớp váng sữa phô mai mặn mà.'),
(N'TR003', N'Trà Sữa Oolong Nướng', @CatTR, 42000, N'available', N'https://images.unsplash.com/photo-1558857563-b37cf533d31b?auto=format&fit=crop&w=600&q=80', N'Vị trà oolong đậm đà được sao nướng kỹ lưỡng quyện cùng sữa tươi thanh trùng, đậm vị trà ít ngọt.'),
(N'TR004', N'Trà Hoa Cúc Mật Ong Rừng', @CatTR, 35000, N'out_of_stock', N'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=600&q=80', N'Thức uống an thần dưỡng tâm với hoa cúc nguyên bông thơm dịu hòa cùng mật ong hoa nhãn nguyên chất.'),
(N'ST001', N'Sinh Tố Bơ Sáp Dừa Non', @CatST, 45000, N'available', N'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=600&q=80', N'Bơ sáp Đắk Lắk dẻo quánh xay cùng nước cốt dừa béo thơm và cơm dừa non sợi giòn dai.'),
(N'ST002', N'Sinh Tố Xoài Chanh Leo', @CatST, 42000, N'available', N'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=600&q=80', N'Vị chua thanh mát bùng nổ của chanh dây kết hợp cùng vị ngọt lịm mọng nước của xoài cát Hòa Lộc.'),
(N'ST003', N'Sinh Tố Dâu Yến Mạch Sữa Chua', @CatST, 48000, N'available', N'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?auto=format&fit=crop&w=600&q=80', N'Dâu tây Đà Lạt tươi mọng xay cùng sữa chua không đường và yến mạch hữu cơ, giàu vitamin & chất xơ.'),
(N'BA001', N'Bánh Tiramisu Ý', @CatBA, 45000, N'available', N'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80', N'Bánh bông lan nhúng cà phê espresso đậm đà xen kẽ từng lớp kem phô mai Mascarpone rắc bột cacao thơm nức.'),
(N'BA002', N'Bánh Croissant Bơ Pháp', @CatBA, 32000, N'available', N'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80', N'Bánh sừng bò ngàn lớp nướng vàng rộm giòn tan bên ngoài, xốp mềm thơm mùi bơ động vật cao cấp bên trong.'),
(N'BA003', N'Bánh Phô Mai Cháy Basque', @CatBA, 49000, N'out_of_stock', N'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80', N'Lớp vỏ cháy caramel quyến rũ bao bọc phần nhân phô mai kem mịn màng, mềm tan ngay đầu lưỡi.'),
(N'BA004', N'Bánh Red Velvet Kem Phô Mai', @CatBA, 46000, N'available', N'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?auto=format&fit=crop&w=600&q=80', N'Cốt bánh nhung đỏ mềm ẩm kết hợp lớp kem phô mai chua nhẹ thanh tao.');
GO

-- ============================================================================
-- 4. SEED ORDERS & ORDER DETAILS (10 Đơn hàng mẫu phục vụ thống kê & test)
-- ============================================================================
DECLARE @User1 INT = (SELECT Id FROM dbo.Users WHERE Username = N'khachhang1');
DECLARE @User2 INT = (SELECT Id FROM dbo.Users WHERE Username = N'khachhang2');

DECLARE @P_CF001 INT = (SELECT Id FROM dbo.Products WHERE Code = N'CF001');
DECLARE @P_CF002 INT = (SELECT Id FROM dbo.Products WHERE Code = N'CF002');
DECLARE @P_CF003 INT = (SELECT Id FROM dbo.Products WHERE Code = N'CF003');
DECLARE @P_CF004 INT = (SELECT Id FROM dbo.Products WHERE Code = N'CF004');
DECLARE @P_TR001 INT = (SELECT Id FROM dbo.Products WHERE Code = N'TR001');
DECLARE @P_TR002 INT = (SELECT Id FROM dbo.Products WHERE Code = N'TR002');
DECLARE @P_ST001 INT = (SELECT Id FROM dbo.Products WHERE Code = N'ST001');
DECLARE @P_BA001 INT = (SELECT Id FROM dbo.Products WHERE Code = N'BA001');
DECLARE @P_BA002 INT = (SELECT Id FROM dbo.Products WHERE Code = N'BA002');

IF NOT EXISTS (SELECT 1 FROM dbo.Orders WHERE OrderCode = N'ORD-20260815-0001')
BEGIN
    -- Đơn 1 (Tháng 8/2026 - Completed): 2x CF001 (58k) + 1x BA002 (32k) = 90.000
    INSERT INTO dbo.Orders (UserId, OrderCode, TotalAmount, Status, Note, CustomerName, CustomerPhone, CreatedAt, UpdatedAt)
    VALUES (@User1, N'ORD-20260815-0001', 90000, N'completed', N'Ít đá, thêm sữa', N'Nguyễn Minh Anh', N'0912345678', '2026-08-15 08:30:00', '2026-08-15 08:45:00');
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (SCOPE_IDENTITY(), @P_CF001, 2, 29000);
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES ((SELECT Id FROM dbo.Orders WHERE OrderCode = N'ORD-20260815-0001'), @P_BA002, 1, 32000);

    -- Đơn 2 (Tháng 9/2026 - Completed): 2x TR001 (78k) + 1x BA001 (45k) = 123.000
    INSERT INTO dbo.Orders (UserId, OrderCode, TotalAmount, Status, Note, CustomerName, CustomerPhone, CreatedAt, UpdatedAt)
    VALUES (@User2, N'ORD-20260910-0002', 123000, N'completed', N'Đóng gói mang đi', N'Trần Hoàng Nam', N'0987654321', '2026-09-10 14:20:00', '2026-09-10 14:40:00');
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (SCOPE_IDENTITY(), @P_TR001, 2, 39000);
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES ((SELECT Id FROM dbo.Orders WHERE OrderCode = N'ORD-20260910-0002'), @P_BA001, 1, 45000);

    -- Đơn 3 (Tháng 9/2026 - Completed): 3x CF003 (105k) + 2x ST001 (90k) = 195.000
    INSERT INTO dbo.Orders (UserId, OrderCode, TotalAmount, Status, Note, CustomerName, CustomerPhone, CreatedAt, UpdatedAt)
    VALUES (@User1, N'ORD-20260922-0003', 195000, N'completed', N'Bàn số 4 tầng 2', N'Nguyễn Minh Anh', N'0912345678', '2026-09-22 10:15:00', '2026-09-22 10:35:00');
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (SCOPE_IDENTITY(), @P_CF003, 3, 35000);
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES ((SELECT Id FROM dbo.Orders WHERE OrderCode = N'ORD-20260922-0003'), @P_ST001, 2, 45000);

    -- Đơn 4 (Tháng 10/2026 - Completed): 2x TR002 (90k) + 2x BA001 (90k) = 180.000
    INSERT INTO dbo.Orders (UserId, OrderCode, TotalAmount, Status, Note, CustomerName, CustomerPhone, CreatedAt, UpdatedAt)
    VALUES (@User2, N'ORD-20261005-0004', 180000, N'completed', N'70% đường', N'Trần Hoàng Nam', N'0987654321', '2026-10-05 16:00:00', '2026-10-05 16:20:00');
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (SCOPE_IDENTITY(), @P_TR002, 2, 45000);
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES ((SELECT Id FROM dbo.Orders WHERE OrderCode = N'ORD-20261005-0004'), @P_BA001, 2, 45000);

    -- Đơn 5 (Tháng 10/2026 - Completed): 4x CF001 (116k) + 2x CF002 (64k) = 180.000
    INSERT INTO dbo.Orders (UserId, OrderCode, TotalAmount, Status, Note, CustomerName, CustomerPhone, CreatedAt, UpdatedAt)
    VALUES (@User1, N'ORD-20261018-0005', 180000, N'completed', N'Đặt cho văn phòng', N'Nguyễn Minh Anh', N'0912345678', '2026-10-18 09:05:00', '2026-10-18 09:25:00');
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (SCOPE_IDENTITY(), @P_CF001, 4, 29000);
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES ((SELECT Id FROM dbo.Orders WHERE OrderCode = N'ORD-20261018-0005'), @P_CF002, 2, 32000);

    -- Đơn 6 (Tháng 11/2026 - Completed): 2x CF004 (78k) + 1x BA002 (32k) = 110.000
    INSERT INTO dbo.Orders (UserId, OrderCode, TotalAmount, Status, Note, CustomerName, CustomerPhone, CreatedAt, UpdatedAt)
    VALUES (@User2, N'ORD-20261102-0006', 110000, N'completed', N'Nóng không đường', N'Trần Hoàng Nam', N'0987654321', '2026-11-02 08:15:00', '2026-11-02 08:30:00');
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (SCOPE_IDENTITY(), @P_CF004, 2, 39000);
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES ((SELECT Id FROM dbo.Orders WHERE OrderCode = N'ORD-20261102-0006'), @P_BA002, 1, 32000);

    -- Đơn 7 (Tháng 11/2026 - Completed): 3x TR001 (117k) + 1x ST001 (45k) = 162.000
    INSERT INTO dbo.Orders (UserId, OrderCode, TotalAmount, Status, Note, CustomerName, CustomerPhone, CreatedAt, UpdatedAt)
    VALUES (@User1, N'ORD-20261105-0007', 162000, N'completed', NULL, N'Nguyễn Minh Anh', N'0912345678', '2026-11-05 15:40:00', '2026-11-05 16:00:00');
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (SCOPE_IDENTITY(), @P_TR001, 3, 39000);
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES ((SELECT Id FROM dbo.Orders WHERE OrderCode = N'ORD-20261105-0007'), @P_ST001, 1, 45000);

    -- Đơn 8 (Tháng 11/2026 - Confirmed): 2x CF003 (70k) + 1x BA001 (45k) = 115.000
    INSERT INTO dbo.Orders (UserId, OrderCode, TotalAmount, Status, Note, CustomerName, CustomerPhone, CreatedAt, UpdatedAt)
    VALUES (@User1, N'ORD-20261110-0008', 115000, N'confirmed', N'Giao lúc 10h sáng', N'Nguyễn Minh Anh', N'0912345678', '2026-11-10 09:50:00', '2026-11-10 09:55:00');
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (SCOPE_IDENTITY(), @P_CF003, 2, 35000);
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES ((SELECT Id FROM dbo.Orders WHERE OrderCode = N'ORD-20261110-0008'), @P_BA001, 1, 45000);

    -- Đơn 9 (Tháng 11/2026 - Pending): 1x CF001 (29k) + 1x TR002 (45k) = 74.000
    INSERT INTO dbo.Orders (UserId, OrderCode, TotalAmount, Status, Note, CustomerName, CustomerPhone, CreatedAt, UpdatedAt)
    VALUES (@User2, N'ORD-20261112-0009', 74000, N'pending', N'Chờ xác nhận', N'Trần Hoàng Nam', N'0987654321', '2026-11-12 08:00:00', '2026-11-12 08:00:00');
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (SCOPE_IDENTITY(), @P_CF001, 1, 29000);
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES ((SELECT Id FROM dbo.Orders WHERE OrderCode = N'ORD-20261112-0009'), @P_TR002, 1, 45000);

    -- Đơn 10 (Tháng 11/2026 - Cancelled): 1x CF002 (32k) = 32.000
    INSERT INTO dbo.Orders (UserId, OrderCode, TotalAmount, Status, Note, CustomerName, CustomerPhone, CreatedAt, UpdatedAt)
    VALUES (@User2, N'ORD-20261112-0010', 32000, N'cancelled', N'Khách đổi ý', N'Trần Hoàng Nam', N'0987654321', '2026-11-12 08:10:00', '2026-11-12 08:12:00');
    INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice) VALUES (SCOPE_IDENTITY(), @P_CF002, 1, 32000);
END
GO
