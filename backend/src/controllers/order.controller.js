const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHelper');
const orderService = require('../services/order.service');

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);
  return sendSuccess(res, 201, 'Đặt hàng thành công', order);
});

const listAllOrders = asyncHandler(async (req, res) => {
  const { items, pagination } = await orderService.listAllOrders(req.query);
  const message =
    items.length === 0 ? 'Không có đơn hàng nào phù hợp' : 'Lấy danh sách đơn hàng thành công';
  return sendSuccess(res, 200, message, items, { pagination });
});

const listMyOrders = asyncHandler(async (req, res) => {
  const { items, pagination } = await orderService.listMyOrders(req.user.id, req.query);
  const message =
    items.length === 0 ? 'Bạn chưa có đơn hàng nào' : 'Lấy lịch sử đơn hàng thành công';
  return sendSuccess(res, 200, message, items, { pagination });
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(parseInt(req.params.id, 10), req.user);
  return sendSuccess(res, 200, 'Lấy chi tiết đơn hàng thành công', order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    parseInt(req.params.id, 10),
    req.body.status,
    req.user,
    req.body.reason
  );
  return sendSuccess(res, 200, 'Cập nhật trạng thái đơn hàng thành công', order);
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelMyOrder(parseInt(req.params.id, 10), req.user, req.body && req.body.reason);
  return sendSuccess(res, 200, 'Hủy đơn hàng thành công', order);
});

const getOrderSummary = asyncHandler(async (req, res) => {
  const summary = await orderService.getOrderSummary();
  return sendSuccess(res, 200, 'Lấy tổng hợp đơn hàng thành công', summary);
});

module.exports = {
  createOrder,
  listAllOrders,
  listMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelMyOrder,
  getOrderSummary
};

