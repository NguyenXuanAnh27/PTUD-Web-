-- ============================================================================
-- TULO COFFEE - MIGRATION 002: QUY TRÌNH DUYỆT ĐƠN & THEO DÕI ĐƠN
-- Chạy MỘT LẦN trên database TuloCoffeeDB đang dùng (chạy lại nhiều lần vẫn an toàn).
-- Việc làm:
--   1. Thêm cột Orders.CancelReason (lý do từ chối/hủy đơn)
--   2. Mở rộng CHECK trạng thái: pending, confirmed, preparing, ready, completed, cancelled
--   3. Tạo bảng OrderStatusHistory (lịch sử đổi trạng thái -> làm timeline cho khách)
--   4. Điền lịch sử cho các đơn đã có để timeline không bị trống
-- Ý nghĩa trạng thái:
--   pending    = Chờ duyệt          (khách vừa gửi đơn)
--   confirmed  = Đã duyệt           (quán nhận đơn)
--   preparing  = Đang pha chế
--   ready      = Sẵn sàng           (món xong, mời khách nhận)
--   completed  = Hoàn thành
--   cancelled  = Đã hủy / bị từ chối (kèm lý do)
-- ============================================================================

USE TuloCoffeeDB;
GO

-- 1. Lý do hủy / từ chối đơn ------------------------------------------------
IF COL_LENGTH(N'dbo.Orders', N'CancelReason') IS NULL
    ALTER TABLE dbo.Orders ADD CancelReason NVARCHAR(255) NULL;
GO

-- 2. Mở rộng ràng buộc trạng thái ---------------------------------------------
IF EXISTS (SELECT 1 FROM sys.check_constraints
           WHERE name = N'CK_Orders_Status' AND parent_object_id = OBJECT_ID(N'dbo.Orders'))
    ALTER TABLE dbo.Orders DROP CONSTRAINT CK_Orders_Status;
GO

ALTER TABLE dbo.Orders ADD CONSTRAINT CK_Orders_Status
    CHECK (Status IN (N'pending', N'confirmed', N'preparing', N'ready', N'completed', N'cancelled'));
GO

-- 3. Bảng lịch sử trạng thái ---------------------------------------------------
IF OBJECT_ID(N'dbo.OrderStatusHistory', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.OrderStatusHistory (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        OrderId         INT           NOT NULL,
        Status          NVARCHAR(20)  NOT NULL,
        Note            NVARCHAR(255) NULL,
        ChangedByRole   NVARCHAR(20)  NOT NULL,
        ChangedByUserId INT           NULL,
        CreatedAt       DATETIME2     NOT NULL CONSTRAINT DF_OrderStatusHistory_CreatedAt DEFAULT GETDATE(),

        CONSTRAINT FK_OrderStatusHistory_Orders FOREIGN KEY (OrderId)
            REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
        CONSTRAINT FK_OrderStatusHistory_Users FOREIGN KEY (ChangedByUserId)
            REFERENCES dbo.Users(Id) ON DELETE SET NULL,
        CONSTRAINT CK_OrderStatusHistory_Status
            CHECK (Status IN (N'pending', N'confirmed', N'preparing', N'ready', N'completed', N'cancelled')),
        CONSTRAINT CK_OrderStatusHistory_Role
            CHECK (ChangedByRole IN (N'customer', N'admin', N'system'))
    );
END
GO

IF NOT EXISTS (SELECT name FROM sys.indexes
               WHERE name = N'IX_OrderStatusHistory_OrderId' AND object_id = OBJECT_ID(N'dbo.OrderStatusHistory'))
    CREATE INDEX IX_OrderStatusHistory_OrderId ON dbo.OrderStatusHistory(OrderId, CreatedAt);
GO

-- 4. Điền lịch sử cho đơn đã có -------------------------------------------------
-- 4a. Mọi đơn đều bắt đầu bằng "pending" tại thời điểm tạo
INSERT INTO dbo.OrderStatusHistory (OrderId, Status, ChangedByRole, CreatedAt)
SELECT o.Id, N'pending', N'system', o.CreatedAt
FROM dbo.Orders o
WHERE NOT EXISTS (SELECT 1 FROM dbo.OrderStatusHistory h WHERE h.OrderId = o.Id);
GO

-- 4b. Đơn đã qua pending: thêm một mốc cho trạng thái hiện tại
INSERT INTO dbo.OrderStatusHistory (OrderId, Status, Note, ChangedByRole, CreatedAt)
SELECT o.Id, o.Status,
       CASE WHEN o.Status = N'cancelled' THEN N'Đơn đã hủy (dữ liệu cũ)' ELSE NULL END,
       N'system', o.UpdatedAt
FROM dbo.Orders o
WHERE o.Status <> N'pending'
  AND NOT EXISTS (SELECT 1 FROM dbo.OrderStatusHistory h WHERE h.OrderId = o.Id AND h.Status = o.Status);
GO

-- Kiểm tra nhanh kết quả
SELECT Status, COUNT(*) AS SoDon FROM dbo.Orders GROUP BY Status;
SELECT COUNT(*) AS SoDongLichSu FROM dbo.OrderStatusHistory;
GO
