const crypto = require('crypto');
const ApiError = require('../utils/ApiError');
const orderRepository = require('../repositories/order.repository');
const userRepository = require('../repositories/user.repository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const MAX_QTY_PER_PRODUCT = 100;
const MAX_ORDER_CODE_ATTEMPTS = 5;

// Mã đơn: ORD-YYYYMMDD-xxxxxx (6 chữ số ngẫu nhiên mật mã học => 900.000 khả năng/ngày)
const generateOrderCode = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const randomSuffix = crypto.randomInt(100000, 1000000);
  return `ORD-${y}${m}${d}-${randomSuffix}`;
};

// Lỗi trùng khóa UNIQUE (2627/2601) xảy ra trên bảng Orders => trùng OrderCode
const isDuplicateOrderCodeError = (err) =>
  (err.number === 2627 || err.number === 2601) && /dbo\.Orders/i.test(err.message || '');

const parseDateOrThrow = (value, field) => {
  if (value === undefined || value === '') return undefined;
  if (Number.isNaN(new Date(value).getTime())) {
    throw new ApiError(400, 'Dữ liệu đầu vào không hợp lệ', [
      { field, message: 'Ngày không hợp lệ (dùng định dạng YYYY-MM-DD)' }
    ]);
  }
  return value;
};

const createOrder = async (userId, { customerName, customerPhone, note, items }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy tài khoản người dùng');
  }

  // Gộp các sản phẩm trùng productId nếu client gửi rời
  const mergedMap = new Map();
  for (const item of items) {
    const prevQty = mergedMap.get(item.productId) || 0;
    mergedMap.set(item.productId, prevQty + item.quantity);
  }
  const normalizedItems = Array.from(mergedMap.entries()).map(([productId, quantity]) => ({
    productId,
    quantity
  }));

  // Sau khi gộp, số lượng mỗi món vẫn phải trong giới hạn (tránh vòng qua giới hạn 100 bằng cách gửi trùng productId)
  const tooMany = normalizedItems.find((it) => it.quantity > MAX_QTY_PER_PRODUCT);
  if (tooMany) {
    throw new ApiError(400, `Tổng số lượng mỗi món tối đa ${MAX_QTY_PER_PRODUCT}`, [
      { field: 'items', message: `Món có ID ${tooMany.productId} vượt quá ${MAX_QTY_PER_PRODUCT} sau khi gộp` }
    ]);
  }

  const orderData = {
    userId,
    customerName: (customerName || user.FullName).trim(),
    customerPhone: (customerPhone || user.Phone || 'Chưa cung cấp').trim(),
    note: note ? note.trim() : null,
    items: normalizedItems
  };

  // Nếu lỡ trùng mã đơn (UNIQUE) thì sinh mã mới và thử lại (transaction đã rollback nên an toàn)
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await orderRepository.createOrderWithDetails({ ...orderData, orderCode: generateOrderCode() });
    } catch (err) {
      if (!isDuplicateOrderCodeError(err) || attempt >= MAX_ORDER_CODE_ATTEMPTS) {
        throw err;
      }
    }
  }
};

const listAllOrders = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { status, keyword } = query;
  const from = parseDateOrThrow(query.from, 'from');
  const to = parseDateOrThrow(query.to, 'to');

  const { items, totalItems } = await orderRepository.findAll({
    status,
    from,
    to,
    keyword: keyword ? keyword.trim() : undefined,
    offset,
    limit
  });

  return {
    items,
    pagination: buildPaginationMeta(page, limit, totalItems)
  };
};

const listMyOrders = async (userId, query) => {
  const { page, limit, offset } = parsePagination(query);
  const { status } = query;

  const { items, totalItems } = await orderRepository.findAll({
    userId,
    status,
    offset,
    limit
  });

  return {
    items,
    pagination: buildPaginationMeta(page, limit, totalItems)
  };
};

/**
 * Kiểm tra quyền sở hữu (Ownership Check):
 * Chỉ Admin hoặc chính chủ đơn hàng mới được xem chi tiết đơn
 */
const getOrderById = async (orderId, currentUser) => {
  const order = await orderRepository.findByIdWithDetails(orderId);
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }

  if (currentUser.role !== 'admin' && order.UserId !== currentUser.id) {
    throw new ApiError(403, 'Bạn không có quyền xem đơn hàng của người khác');
  }

  return order;
};

const updateOrderStatus = async (orderId, newStatus) => {
  const order = await orderRepository.findByIdWithDetails(orderId);
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }

  if (order.Status === 'cancelled') {
    throw new ApiError(400, 'Không thể thay đổi trạng thái đơn hàng đã bị hủy');
  }

  if (order.Status === 'completed' && newStatus !== 'completed') {
    throw new ApiError(400, 'Đơn hàng đã hoàn thành, không thể chuyển về trạng thái khác');
  }

  // Không cho lùi về "pending" khi đơn đã được xử lý (vd: confirmed -> pending)
  if (newStatus === 'pending' && order.Status !== 'pending') {
    throw new ApiError(400, 'Không thể chuyển đơn hàng đã xử lý về trạng thái chờ xử lý (pending)');
  }

  return orderRepository.updateStatus(orderId, newStatus);
};

/**
 * Khách hàng hủy đơn hàng của chính mình (chỉ khi đơn đang ở trạng thái pending)
 */
const cancelMyOrder = async (orderId, currentUser) => {
  const order = await orderRepository.findByIdWithDetails(orderId);
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }

  if (currentUser.role !== 'admin' && order.UserId !== currentUser.id) {
    throw new ApiError(403, 'Bạn không có quyền hủy đơn hàng của người khác');
  }

  if (order.Status !== 'pending') {
    throw new ApiError(400, 'Chỉ có thể hủy đơn hàng khi đang ở trạng thái chờ xử lý (pending)');
  }

  return orderRepository.updateStatus(orderId, 'cancelled');
};

module.exports = {
  createOrder,
  listAllOrders,
  listMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelMyOrder
};

