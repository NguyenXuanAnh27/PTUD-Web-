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
/**
 * Quy trình duyệt đơn như một quán thật:
 *   pending (Chờ duyệt) -> confirmed (Đã duyệt) -> preparing (Đang pha chế) -> ready (Sẵn sàng) -> completed (Hoàn thành)
 * Từ bất kỳ bước chưa hoàn thành nào, quán có thể "cancelled" (từ chối/hủy) nhưng PHẢI kèm lý do.
 * "completed" và "cancelled" là trạng thái cuối, không đổi nữa.
 */
const ORDER_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

const STATUS_LABELS = {
  pending: 'Chờ duyệt',
  confirmed: 'Đã duyệt',
  preparing: 'Đang pha chế',
  ready: 'Sẵn sàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy'
};

/**
 * Đơn cũ (tạo trước khi có bảng lịch sử) chưa có dòng lịch sử nào:
 * dựng tạm timeline từ thời điểm tạo/cập nhật để màn hình theo dõi không bị trống.
 */
const withHistoryFallback = (order) => {
  if (order.history && order.history.length > 0) return order;

  const history = [
    {
      Status: 'pending',
      Note: null,
      ChangedByRole: 'system',
      CreatedAt: order.CreatedAt,
      SecondsAgo: order.CreatedSecondsAgo
    }
  ];
  if (order.Status !== 'pending') {
    history.push({
      Status: order.Status,
      Note: order.CancelReason || null,
      ChangedByRole: 'system',
      CreatedAt: order.UpdatedAt,
      SecondsAgo: order.UpdatedSecondsAgo
    });
  }
  return { ...order, history };
};

const getOrderById = async (orderId, currentUser) => {
  const order = await orderRepository.findByIdWithDetails(orderId);
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }

  if (currentUser.role !== 'admin' && order.UserId !== currentUser.id) {
    throw new ApiError(403, 'Bạn không có quyền xem đơn hàng của người khác');
  }

  return withHistoryFallback(order);
};

/**
 * Admin duyệt/xử lý đơn. Mỗi lần chỉ được đi đúng bước kế tiếp (hoặc hủy kèm lý do).
 */
const updateOrderStatus = async (orderId, newStatus, actor, reason) => {
  const order = await orderRepository.findByIdWithDetails(orderId);
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }

  if (order.Status === newStatus) {
    throw new ApiError(400, `Đơn hàng đã ở trạng thái "${STATUS_LABELS[newStatus]}" rồi`);
  }

  const allowed = ORDER_TRANSITIONS[order.Status] || [];
  if (!allowed.includes(newStatus)) {
    const hint = allowed.length
      ? `Từ "${STATUS_LABELS[order.Status]}" chỉ có thể chuyển sang: ${allowed.map((s) => `"${STATUS_LABELS[s]}"`).join(', ')}`
      : `Đơn hàng đã ở trạng thái cuối "${STATUS_LABELS[order.Status]}", không thể thay đổi`;
    throw new ApiError(400, hint);
  }

  const cleanReason = reason ? String(reason).trim() : '';
  if (newStatus === 'cancelled' && cleanReason.length < 3) {
    throw new ApiError(400, 'Vui lòng nhập lý do từ chối/hủy đơn (tối thiểu 3 ký tự)', [
      { field: 'reason', message: 'Lý do bắt buộc khi hủy đơn' }
    ]);
  }

  const updated = await orderRepository.updateStatus(orderId, {
    expectedStatus: order.Status,
    status: newStatus,
    reason: cleanReason || null,
    role: 'admin',
    userId: actor && actor.id
  });
  return withHistoryFallback(updated);
};

/**
 * Khách hàng hủy đơn hàng của chính mình (chỉ khi quán chưa duyệt - trạng thái pending)
 */
const cancelMyOrder = async (orderId, currentUser, reason) => {
  const order = await orderRepository.findByIdWithDetails(orderId);
  if (!order) {
    throw new ApiError(404, 'Không tìm thấy đơn hàng');
  }

  if (currentUser.role !== 'admin' && order.UserId !== currentUser.id) {
    throw new ApiError(403, 'Bạn không có quyền hủy đơn hàng của người khác');
  }

  if (order.Status !== 'pending') {
    throw new ApiError(400, 'Chỉ có thể hủy đơn khi quán chưa duyệt (trạng thái "Chờ duyệt"). Vui lòng liên hệ quán để được hỗ trợ');
  }

  const cleanReason = reason ? String(reason).trim() : '';
  const updated = await orderRepository.updateStatus(orderId, {
    expectedStatus: 'pending',
    status: 'cancelled',
    reason: cleanReason || (currentUser.role === 'admin' ? 'Quán hủy đơn' : 'Khách hàng hủy đơn'),
    role: currentUser.role === 'admin' ? 'admin' : 'customer',
    userId: currentUser.id
  });
  return withHistoryFallback(updated);
};

/**
 * Số đơn theo từng trạng thái + ID đơn chờ duyệt mới nhất (để báo "có đơn mới" cho admin)
 */
const getOrderSummary = async () => {
  const rows = await orderRepository.getStatusSummary();
  const counts = Object.keys(ORDER_TRANSITIONS).reduce((acc, status) => ({ ...acc, [status]: 0 }), {});
  let latestPendingOrderId = 0;

  for (const row of rows) {
    if (row.Status in counts) counts[row.Status] = row.Total;
    if (row.Status === 'pending') latestPendingOrderId = row.LatestId || 0;
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const active = counts.pending + counts.confirmed + counts.preparing + counts.ready;
  return { counts, total, active, latestPendingOrderId };
};

module.exports = {
  createOrder,
  listAllOrders,
  listMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelMyOrder,
  getOrderSummary,
  ORDER_TRANSITIONS
};

