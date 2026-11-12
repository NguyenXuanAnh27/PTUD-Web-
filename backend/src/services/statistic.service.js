const statisticRepository = require('../repositories/statistic.repository');

const getOverview = async () => {
  return statisticRepository.getOverview();
};

const getMonthlyRevenue = async (yearParam) => {
  const year = parseInt(yearParam, 10) || new Date().getFullYear();
  const rows = await statisticRepository.getMonthlyRevenue(year);

  // Bổ sung đủ 12 tháng (tháng không có đơn trả revenue = 0) để biểu đồ frontend dễ vẽ
  const monthMap = new Map(rows.map((r) => [r.Month, r]));
  const fullYear = [];
  for (let m = 1; m <= 12; m += 1) {
    const found = monthMap.get(m);
    fullYear.push({
      month: m,
      orderCount: found ? found.OrderCount : 0,
      revenue: found ? found.Revenue : 0
    });
  }

  return {
    year,
    months: fullYear
  };
};

const getOrdersByDay = async (monthParam, yearParam) => {
  const now = new Date();
  const month = parseInt(monthParam, 10) || now.getMonth() + 1;
  const year = parseInt(yearParam, 10) || now.getFullYear();

  const days = await statisticRepository.getOrdersByDay({ month, year });
  return {
    month,
    year,
    days
  };
};

const getTopProducts = async (limitParam) => {
  const limit = Math.min(20, Math.max(1, parseInt(limitParam, 10) || 5));
  return statisticRepository.getTopProducts(limit);
};

const getCategoryDistribution = async () => {
  return statisticRepository.getCategoryDistribution();
};

module.exports = {
  getOverview,
  getMonthlyRevenue,
  getOrdersByDay,
  getTopProducts,
  getCategoryDistribution
};

