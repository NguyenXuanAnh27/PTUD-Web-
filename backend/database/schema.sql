-- ============================================================================
-- TULO COFFEE - DATABASE SCHEMA (SQL SERVER)
-- Môn: Phát triển ứng dụng Web (PROG2008)
-- Chuẩn hóa: 3NF | Ràng buộc: PK, FK, UNIQUE, NOT NULL, CHECK, DEFAULT, INDEX
-- ============================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'TuloCoffeeDB')
BEGIN
    CREATE DATABASE TuloCoffeeDB;
END
GO

USE TuloCoffeeDB;
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================================
-- 1. BẢNG USERS (Người dùng & Phân quyền)
-- ============================================================================
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Username     NVARCHAR(50)  NOT NULL UNIQUE,
        Email        NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        FullName     NVARCHAR(100) NOT NULL,
        Phone        NVARCHAR(20)  NULL,
        Role         NVARCHAR(20)  NOT NULL CONSTRAINT DF_Users_Role DEFAULT N'customer',
        IsActive     BIT           NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
        CreatedAt    DATETIME2     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT GETDATE(),
        UpdatedAt    DATETIME2     NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT GETDATE(),

        CONSTRAINT CK_Users_Role CHECK (Role IN (N'admin', N'customer'))
    );
END
GO

-- Index phục vụ tìm kiếm / lọc người dùng
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_Users_Role' AND object_id = OBJECT_ID(N'dbo.Users'))
    CREATE INDEX IX_Users_Role ON dbo.Users(Role);
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_Users_IsActive' AND object_id = OBJECT_ID(N'dbo.Users'))
    CREATE INDEX IX_Users_IsActive ON dbo.Users(IsActive);
GO

-- ============================================================================
-- 2. BẢNG TOKEN BLACKLIST (Quản lý token đã đăng xuất)
-- ============================================================================
IF OBJECT_ID(N'dbo.TokenBlacklist', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TokenBlacklist (
        Id        INT IDENTITY(1,1) PRIMARY KEY,
        Token     NVARCHAR(500) NOT NULL UNIQUE,
        ExpiresAt DATETIME2     NOT NULL,
        CreatedAt DATETIME2     NOT NULL CONSTRAINT DF_TokenBlacklist_CreatedAt DEFAULT GETDATE()
    );
END
GO

-- ============================================================================
-- 3. BẢNG CATEGORIES (Danh mục món)
-- ============================================================================
IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories (
        Id          INT IDENTITY(1,1) PRIMARY KEY,
        Name        NVARCHAR(100) NOT NULL UNIQUE,
        Code        NVARCHAR(10)  NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL,
        SortOrder   INT           NOT NULL CONSTRAINT DF_Categories_SortOrder DEFAULT 0,
        IsActive    BIT           NOT NULL CONSTRAINT DF_Categories_IsActive DEFAULT 1,
        CreatedAt   DATETIME2     NOT NULL CONSTRAINT DF_Categories_CreatedAt DEFAULT GETDATE()
    );
END
GO

-- ============================================================================
-- 4. BẢNG PRODUCTS (Thực đơn: Đồ uống & Bánh ngọt)
-- ============================================================================
IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Products (
        Id          INT IDENTITY(1,1) PRIMARY KEY,
        Code        NVARCHAR(20)  NOT NULL UNIQUE,
        Name        NVARCHAR(150) NOT NULL,
        CategoryId  INT           NOT NULL,
        Price       INT           NOT NULL,
        Status      NVARCHAR(20)  NOT NULL CONSTRAINT DF_Products_Status DEFAULT N'available',
        Image       NVARCHAR(500) NULL,
        Description NVARCHAR(500) NULL,
        IsDeleted   BIT           NOT NULL CONSTRAINT DF_Products_IsDeleted DEFAULT 0,
        CreatedAt   DATETIME2     NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT GETDATE(),
        UpdatedAt   DATETIME2     NOT NULL CONSTRAINT DF_Products_UpdatedAt DEFAULT GETDATE(),

        CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId)
            REFERENCES dbo.Categories(Id) ON DELETE NO ACTION,
        CONSTRAINT CK_Products_Price CHECK (Price > 0 AND Price <= 10000000),
        CONSTRAINT CK_Products_Status CHECK (Status IN (N'available', N'out_of_stock'))
    );
END
GO

-- Index phục vụ tìm kiếm & lọc sản phẩm
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_Products_Name' AND object_id = OBJECT_ID(N'dbo.Products'))
    CREATE INDEX IX_Products_Name ON dbo.Products(Name);
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_Products_CategoryId' AND object_id = OBJECT_ID(N'dbo.Products'))
    CREATE INDEX IX_Products_CategoryId ON dbo.Products(CategoryId);
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_Products_Status_IsDeleted' AND object_id = OBJECT_ID(N'dbo.Products'))
    CREATE INDEX IX_Products_Status_IsDeleted ON dbo.Products(Status, IsDeleted);
GO

-- ============================================================================
-- 5. BẢNG ORDERS (Đơn hàng)
-- ============================================================================
IF OBJECT_ID(N'dbo.Orders', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Orders (
        Id            INT IDENTITY(1,1) PRIMARY KEY,
        UserId        INT           NOT NULL,
        OrderCode     NVARCHAR(30)  NOT NULL UNIQUE,
        TotalAmount   INT           NOT NULL CONSTRAINT DF_Orders_TotalAmount DEFAULT 0,
        Status        NVARCHAR(20)  NOT NULL CONSTRAINT DF_Orders_Status DEFAULT N'pending',
        Note          NVARCHAR(500) NULL,
        CustomerName  NVARCHAR(100) NOT NULL,
        CustomerPhone NVARCHAR(20)  NOT NULL,
        CreatedAt     DATETIME2     NOT NULL CONSTRAINT DF_Orders_CreatedAt DEFAULT GETDATE(),
        UpdatedAt     DATETIME2     NOT NULL CONSTRAINT DF_Orders_UpdatedAt DEFAULT GETDATE(),

        CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId)
            REFERENCES dbo.Users(Id) ON DELETE NO ACTION,
        CONSTRAINT CK_Orders_TotalAmount CHECK (TotalAmount >= 0),
        CONSTRAINT CK_Orders_Status CHECK (Status IN (N'pending', N'confirmed', N'completed', N'cancelled'))
    );
END
GO

-- Index phục vụ lọc đơn hàng & thống kê theo thời gian
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_Orders_UserId' AND object_id = OBJECT_ID(N'dbo.Orders'))
    CREATE INDEX IX_Orders_UserId ON dbo.Orders(UserId);
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_Orders_Status_CreatedAt' AND object_id = OBJECT_ID(N'dbo.Orders'))
    CREATE INDEX IX_Orders_Status_CreatedAt ON dbo.Orders(Status, CreatedAt);
GO

-- ============================================================================
-- 6. BẢNG ORDER DETAILS (Chi tiết đơn hàng - tách 3NF)
-- ============================================================================
IF OBJECT_ID(N'dbo.OrderDetails', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderDetails (
        Id        INT IDENTITY(1,1) PRIMARY KEY,
        OrderId   INT NOT NULL,
        ProductId INT NOT NULL,
        Quantity  INT NOT NULL,
        UnitPrice INT NOT NULL,
        Subtotal  AS (Quantity * UnitPrice) PERSISTED,

        CONSTRAINT FK_OrderDetails_Orders FOREIGN KEY (OrderId)
            REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderDetails_Products FOREIGN KEY (ProductId)
            REFERENCES dbo.Products(Id) ON DELETE NO ACTION,
        CONSTRAINT CK_OrderDetails_Quantity CHECK (Quantity > 0),
        CONSTRAINT CK_OrderDetails_UnitPrice CHECK (UnitPrice >= 0)
    );
END
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_OrderDetails_OrderId' AND object_id = OBJECT_ID(N'dbo.OrderDetails'))
    CREATE INDEX IX_OrderDetails_OrderId ON dbo.OrderDetails(OrderId);
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = N'IX_OrderDetails_ProductId' AND object_id = OBJECT_ID(N'dbo.OrderDetails'))
    CREATE INDEX IX_OrderDetails_ProductId ON dbo.OrderDetails(ProductId);
GO
