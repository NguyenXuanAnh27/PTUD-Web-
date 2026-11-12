const ApiError = require('../utils/ApiError');
const orderRepository = require('../repositories/order.repository');
const userRepository = require('../repositories/user.repository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const generateOrderCode = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${y}${m}${d}-${randomSuffix}`;
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

  const orderCode = generateOrderCode();

  return orderRepository.createOrderWithDetails({
    userId,
    orderCode,
    customerName: (customerName || user.FullName).trim(),
    customerPhone: (customerPhone || user.Phone || 'Chưa cung cấp').trim(),
    note: note ? note.trim() : null,
    items: normalizedItems
  });
};

const listAllOrders = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { status, from, to, keyword } = query;

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

