const { sql, getPool } = require('../config/db');

/**
 * Thống kê tổng quan toàn hệ thống (dùng truy vấn tổng hợp thật từ DB)
 */
const getOverview = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      (SELECT ISNULL(SUM(TotalAmount), 0) FROM dbo.Orders WHERE Status = N'completed') AS TotalRevenue,
      (SELECT COUNT(*) FROM dbo.Orders) AS TotalOrders,
      (SELECT COUNT(*) FROM dbo.Orders WHERE Status = N'pending') AS PendingOrders,
      (SELECT COUNT(*) FROM dbo.Orders WHERE Status = N'completed') AS CompletedOrders,
      (SELECT COUNT(*) FROM dbo.Products WHERE IsDeleted = 0) AS TotalProducts,
      (SELECT COUNT(*) FROM dbo.Products WHERE IsDeleted = 0 AND Status = N'available') AS AvailableProducts,
      (SELECT COUNT(*) FROM dbo.Products WHERE IsDeleted = 0 AND Status = N'out_of_stock') AS OutOfStockProducts,
      (SELECT ISNULL(AVG(CAST(Price AS FLOAT)), 0) FROM dbo.Products WHERE IsDeleted = 0) AS AverageProductPrice,
      (SELECT COUNT(*) FROM dbo.Users WHERE Role = N'customer') AS TotalCustomers
  `);
  return result.recordset[0];
};

/**
 * Thống kê doanh thu theo từng tháng trong năm (GROUP BY MONTH)
 */
const getMonthlyRevenue = async (year) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('year', sql.Int, year)
    .query(`
      SELECT
        MONTH(CreatedAt) AS Month,
        COUNT(*) AS OrderCount,
        SUM(TotalAmount) AS Revenue
      FROM dbo.Orders
      WHERE YEAR(CreatedAt) = @year
        AND Status IN (N'completed', N'confirmed')
      GROUP BY MONTH(CreatedAt)
      ORDER BY Month ASC
    `);
  return result.recordset;
};

/**
 * Thống kê số đơn và doanh thu theo từng ngày trong tháng/năm
 */
const getOrdersByDay = async ({ month, year }) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('month', sql.Int, month)
    .input('year', sql.Int, year)
    .query(`
      SELECT
        CONVERT(VARCHAR(10), CreatedAt, 23) AS OrderDate,
        COUNT(*) AS TotalOrders,
        SUM(CASE WHEN Status = N'completed' THEN TotalAmount ELSE 0 END) AS CompletedRevenue,
        SUM(CASE WHEN Status = N'cancelled' THEN 1 ELSE 0 END) AS CancelledOrders
      FROM dbo.Orders
      WHERE MONTH(CreatedAt) = @month
        AND YEAR(CreatedAt) = @year
      GROUP BY CONVERT(VARCHAR(10), CreatedAt, 23)
      ORDER BY OrderDate ASC
    `);
  return result.recordset;
};

/**
 * Top N món bán chạy nhất (JOIN OrderDetails + Products + Categories, GROUP BY)
 */
const getTopProducts = async (limit = 5) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit)
        p.Id AS ProductId,
        p.Code AS ProductCode,
        p.Name AS ProductName,
        c.Name AS CategoryName,
        p.Price AS CurrentPrice,
        SUM(od.Quantity) AS TotalQuantitySold,
        SUM(od.Subtotal) AS TotalRevenue
      FROM dbo.OrderDetails od
      INNER JOIN dbo.Orders o ON od.OrderId = o.Id
      INNER JOIN dbo.Products p ON od.ProductId = p.Id
      INNER JOIN dbo.Categories c ON p.CategoryId = c.Id
      WHERE o.Status <> N'cancelled'
      GROUP BY p.Id, p.Code, p.Name, c.Name, p.Price
      ORDER BY TotalQuantitySold DESC, TotalRevenue DESC
    `);
  return result.recordset;
};

/**
 * Phân bổ số lượng món & doanh thu theo từng danh mục (GROUP BY)
 */
const getCategoryDistribution = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      c.Id AS CategoryId,
      c.Code AS CategoryCode,
      c.Name AS CategoryName,
      COUNT(DISTINCT CASE WHEN p.IsDeleted = 0 THEN p.Id END) AS ProductCount,
      ISNULL(SUM(CASE WHEN o.Status <> N'cancelled' THEN od.Quantity ELSE 0 END), 0) AS TotalQuantitySold,
      ISNULL(SUM(CASE WHEN o.Status <> N'cancelled' THEN od.Subtotal ELSE 0 END), 0) AS TotalRevenue
    FROM dbo.Categories c
    LEFT JOIN dbo.Products p ON p.CategoryId = c.Id
    LEFT JOIN dbo.OrderDetails od ON od.ProductId = p.Id
    LEFT JOIN dbo.Orders o ON od.OrderId = o.Id
    GROUP BY c.Id, c.Code, c.Name, c.SortOrder
    ORDER BY c.SortOrder ASC, TotalRevenue DESC
  `);
  return result.recordset;
};

module.exports = {
  getOverview,
  getMonthlyRevenue,
  getOrdersByDay,
  getTopProducts,
  getCategoryDistribution
};

