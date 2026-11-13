const { sql, getPool } = require('../config/db');
const ApiError = require('../utils/ApiError');

/**
 * Tạo đơn hàng mới + danh sách chi tiết đơn hàng trong 1 SQL Transaction
 * Đảm bảo tính toàn vẹn dữ liệu: lỗi ở bất kỳ bước nào sẽ ROLLBACK toàn bộ
 */
const createOrderWithDetails = async ({ userId, orderCode, customerName, customerPhone, note, items }) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  try {
    let totalAmount = 0;
    const resolvedItems = [];

    // Bước 1: Kiểm tra từng sản phẩm trong DB và lấy giá thực tế (không tin giá từ client)
    for (const item of items) {
      const productReq = new sql.Request(transaction);
      const productResult = await productReq
        .input('productId', sql.Int, item.productId)
        .query(`
          SELECT Id, Name, Price, Status
          FROM dbo.Products
          WHERE Id = @productId AND IsDeleted = 0
        `);

      const product = productResult.recordset[0];
      if (!product) {
        throw new ApiError(404, `Sản phẩm có ID ${item.productId} không tồn tại`);
      }

      if (product.Status !== 'available') {
        throw new ApiError(400, `Món "${product.Name}" hiện đang tạm hết hàng`);
      }

      const subtotal = product.Price * item.quantity;
      totalAmount += subtotal;

      resolvedItems.push({
        productId: product.Id,
        quantity: item.quantity,
        unitPrice: product.Price
      });
    }

    // Cột TotalAmount là INT (tối đa ~2,1 tỷ): chặn sớm để trả 400 thay vì lỗi tràn số (500)
    if (totalAmount > 2147483647) {
      throw new ApiError(400, 'Tổng giá trị đơn hàng vượt quá giới hạn cho phép, vui lòng tách thành nhiều đơn');
    }

    // Bước 2: Thêm bản ghi vào bảng Orders
    const orderReq = new sql.Request(transaction);
    const orderResult = await orderReq
      .input('userId', sql.Int, userId)
      .input('orderCode', sql.NVarChar(30), orderCode)
      .input('totalAmount', sql.Int, totalAmount)
      .input('status', sql.NVarChar(20), 'pending')
      .input('note', sql.NVarChar(500), note || null)
      .input('customerName', sql.NVarChar(100), customerName)
      .input('customerPhone', sql.NVarChar(20), customerPhone)
      .query(`
        INSERT INTO dbo.Orders (UserId, OrderCode, TotalAmount, Status, Note, CustomerName, CustomerPhone)
        OUTPUT INSERTED.*
        VALUES (@userId, @orderCode, @totalAmount, @status, @note, @customerName, @customerPhone)
      `);

    const createdOrder = orderResult.recordset[0];

    // Bước 3: Thêm từng chi tiết món vào OrderDetails
    for (const detail of resolvedItems) {
      const detailReq = new sql.Request(transaction);
      await detailReq
        .input('orderId', sql.Int, createdOrder.Id)
        .input('productId', sql.Int, detail.productId)
        .input('quantity', sql.Int, detail.quantity)
        .input('unitPrice', sql.Int, detail.unitPrice)
        .query(`
          INSERT INTO dbo.OrderDetails (OrderId, ProductId, Quantity, UnitPrice)
          VALUES (@orderId, @productId, @quantity, @unitPrice)
        `);
    }

    await transaction.commit();
    return findByIdWithDetails(createdOrder.Id);
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {
      // Bỏ qua lỗi rollback nếu transaction đã tự đóng
    }
    throw err;
  }
};

const findAll = async ({ status, from, to, keyword, userId, offset, limit }) => {
  const pool = await getPool();
  const request = pool.request();
  const conditions = ['1 = 1'];

  if (userId) {
    request.input('userId', sql.Int, userId);
    conditions.push('o.UserId = @userId');
  }
  if (status && status !== 'all') {
    request.input('status', sql.NVarChar(20), status);
    conditions.push('o.Status = @status');
  }
  if (from) {
    request.input('fromDate', sql.DateTime2, new Date(from));
    conditions.push('o.CreatedAt >= @fromDate');
  }
  if (to) {
    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);
    request.input('toDate', sql.DateTime2, toEnd);
    conditions.push('o.CreatedAt <= @toDate');
  }
  if (keyword) {
    request.input('keyword', sql.NVarChar(150), `%${keyword}%`);
    conditions.push('(o.OrderCode LIKE @keyword OR o.CustomerName LIKE @keyword OR o.CustomerPhone LIKE @keyword)');
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await request.query(`
    SELECT COUNT(*) AS TotalItems
    FROM dbo.Orders o
    WHERE ${whereClause}
  `);
  const totalItems = countResult.recordset[0].TotalItems;

  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const dataResult = await request.query(`
    SELECT o.Id, o.UserId, u.Username, o.OrderCode, o.TotalAmount, o.Status,
           o.Note, o.CustomerName, o.CustomerPhone, o.CreatedAt, o.UpdatedAt,
           (SELECT COUNT(*) FROM dbo.OrderDetails od WHERE od.OrderId = o.Id) AS ItemCount
    FROM dbo.Orders o
    INNER JOIN dbo.Users u ON o.UserId = u.Id
    WHERE ${whereClause}
    ORDER BY o.CreatedAt DESC, o.Id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return {
    items: dataResult.recordset,
    totalItems
  };
};

const findByIdWithDetails = async (id) => {
  const pool = await getPool();

  const orderResult = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT o.Id, o.UserId, u.Username, u.Email AS UserEmail,
             o.OrderCode, o.TotalAmount, o.Status, o.Note,
             o.CustomerName, o.CustomerPhone, o.CreatedAt, o.UpdatedAt
      FROM dbo.Orders o
      INNER JOIN dbo.Users u ON o.UserId = u.Id
      WHERE o.Id = @id
    `);

  const order = orderResult.recordset[0];
  if (!order) return null;

  const detailsResult = await pool
    .request()
    .input('orderId', sql.Int, id)
    .query(`
      SELECT od.Id, od.ProductId, p.Code AS ProductCode, p.Name AS ProductName,
             p.Image AS ProductImage, od.Quantity, od.UnitPrice, od.Subtotal
      FROM dbo.OrderDetails od
      INNER JOIN dbo.Products p ON od.ProductId = p.Id
      WHERE od.OrderId = @orderId
      ORDER BY od.Id ASC
    `);

  return {
    ...order,
    items: detailsResult.recordset
  };
};

const updateStatus = async (id, status) => {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('status', sql.NVarChar(20), status)
    .query(`
      UPDATE dbo.Orders
      SET Status = @status,
          UpdatedAt = GETDATE()
      WHERE Id = @id
    `);

  return findByIdWithDetails(id);
};

module.exports = {
  createOrderWithDetails,
  findAll,
  findByIdWithDetails,
  updateStatus
};

