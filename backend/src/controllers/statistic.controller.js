const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHelper');
const statisticService = require('../services/statistic.service');

const getOverview = asyncHandler(async (req, res) => {
  const data = await statisticService.getOverview();
  return sendSuccess(res, 200, 'Lấy thống kê tổng quan thành công', data);
});

const getMonthlyRevenue = asyncHandler(async (req, res) => {
  const data = await statisticService.getMonthlyRevenue(req.query.year);
  return sendSuccess(res, 200, 'Lấy thống kê doanh thu theo tháng thành công', data);
});

const getOrdersByDay = asyncHandler(async (req, res) => {
  const data = await statisticService.getOrdersByDay(req.query.month, req.query.year);
  return sendSuccess(res, 200, 'Lấy thống kê đơn hàng theo ngày thành công', data);
});

const getTopProducts = asyncHandler(async (req, res) => {
  const data = await statisticService.getTopProducts(req.query.limit);
  return sendSuccess(res, 200, 'Lấy danh sách món bán chạy nhất thành công', data);
});

const getCategoryDistribution = asyncHandler(async (req, res) => {
  const data = await statisticService.getCategoryDistribution();
  return sendSuccess(res, 200, 'Lấy thống kê phân bổ theo danh mục thành công', data);
});

module.exports = {
  getOverview,
  getMonthlyRevenue,
  getOrdersByDay,
  getTopProducts,
  getCategoryDistribution
};

