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

    // Bước 4: Ghi mốc đầu tiên của lịch sử trạng thái (khách vừa gửi đơn)
    const historyReq = new sql.Request(transaction);
    await historyReq
      .input('orderId', sql.Int, createdOrder.Id)
      .input('status', sql.NVarChar(20), 'pending')
      .input('role', sql.NVarChar(20), 'customer')
      .input('changedBy', sql.Int, userId)
      .query(`
        INSERT INTO dbo.OrderStatusHistory (OrderId, Status, ChangedByRole, ChangedByUserId)
        VALUES (@orderId, @status, @role, @changedBy)
      `);

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
  if (status === 'active') {
    // "Đang xử lý": mọi đơn chưa hoàn thành và chưa hủy
    conditions.push(`o.Status IN (N'pending', N'confirmed', N'preparing', N'ready')`);
  } else if (status && status !== 'all') {
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
           o.Note, o.CancelReason, o.CustomerName, o.CustomerPhone, o.CreatedAt, o.UpdatedAt,
           -- "Cách đây bao nhiêu giây" tính ngay trong SQL: không phụ thuộc cách driver/trình duyệt hiểu múi giờ
           DATEDIFF(SECOND, o.CreatedAt, GETDATE()) AS CreatedSecondsAgo,
           DATEDIFF(SECOND, o.UpdatedAt, GETDATE()) AS UpdatedSecondsAgo,
           (SELECT COUNT(*) FROM dbo.OrderDetails od WHERE od.OrderId = o.Id) AS ItemCount,
           -- Tóm tắt món để chủ quán nhìn là biết cần pha gì ("2x Cà phê sữa đá, 1x Bạc xỉu")
           STUFF((
             SELECT N', ' + CAST(d.Quantity AS NVARCHAR(10)) + N'x ' + p.Name
             FROM dbo.OrderDetails d
             INNER JOIN dbo.Products p ON d.ProductId = p.Id
             WHERE d.OrderId = o.Id
             ORDER BY d.Id
             FOR XML PATH(''), TYPE
           ).value('.', 'NVARCHAR(MAX)'), 1, 2, N'') AS ItemsSummary
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
             o.OrderCode, o.TotalAmount, o.Status, o.Note, o.CancelReason,
             o.CustomerName, o.CustomerPhone, o.CreatedAt, o.UpdatedAt,
             DATEDIFF(SECOND, o.CreatedAt, GETDATE()) AS CreatedSecondsAgo,
             DATEDIFF(SECOND, o.UpdatedAt, GETDATE()) AS UpdatedSecondsAgo
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

  const historyResult = await pool
    .request()
    .input('orderId', sql.Int, id)
    .query(`
      SELECT Id, Status, Note, ChangedByRole, CreatedAt,
             DATEDIFF(SECOND, CreatedAt, GETDATE()) AS SecondsAgo
      FROM dbo.OrderStatusHistory
      WHERE OrderId = @orderId
      ORDER BY CreatedAt ASC, Id ASC
    `);

  return {
    ...order,
    items: detailsResult.recordset,
    history: historyResult.recordset
  };
};

/**
 * Đổi trạng thái đơn + ghi lịch sử trong 1 transaction.
 * Dùng khóa lạc quan (expectedStatus): nếu giữa lúc đọc và lúc ghi có người khác đã đổi trạng thái
 * (vd: 2 nhân viên cùng bấm) thì trả 409 thay vì ghi đè lên nhau.
 */
const updateStatus = async (id, { expectedStatus, status, reason, role, userId }) => {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const updateResult = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .input('expected', sql.NVarChar(20), expectedStatus)
      .input('status', sql.NVarChar(20), status)
      .input('reason', sql.NVarChar(255), status === 'cancelled' ? reason || null : null)
      .query(`
        UPDATE dbo.Orders
        SET Status = @status,
            CancelReason = CASE WHEN @status = N'cancelled' THEN @reason ELSE CancelReason END,
            UpdatedAt = GETDATE()
        WHERE Id = @id AND Status = @expected
      `);

    if (!updateResult.rowsAffected[0]) {
      throw new ApiError(409, 'Đơn hàng vừa được cập nhật ở nơi khác, vui lòng tải lại danh sách đơn');
    }

    await new sql.Request(transaction)
      .input('orderId', sql.Int, id)
      .input('status', sql.NVarChar(20), status)
      .input('note', sql.NVarChar(255), reason || null)
      .input('role', sql.NVarChar(20), role)
      .input('changedBy', sql.Int, userId || null)
      .query(`
        INSERT INTO dbo.OrderStatusHistory (OrderId, Status, Note, ChangedByRole, ChangedByUserId)
        VALUES (@orderId, @status, @note, @role, @changedBy)
      `);

    await transaction.commit();
  } catch (err) {
    try {
      await transaction.rollback();
    } catch {
      // Bỏ qua lỗi rollback nếu transaction đã tự đóng
    }
    throw err;
  }

  return findByIdWithDetails(id);
};

/**
 * Tổng hợp số đơn theo trạng thái (cho bảng duyệt đơn của admin) + ID đơn "chờ duyệt" mới nhất
 * để trình duyệt biết khi nào có đơn mới mà báo chuông.
 */
const getStatusSummary = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT Status, COUNT(*) AS Total, MAX(Id) AS LatestId
    FROM dbo.Orders
    GROUP BY Status
  `);
  return result.recordset;
};

module.exports = {
  createOrderWithDetails,
  findAll,
  findByIdWithDetails,
  updateStatus,
  getStatusSummary
};

