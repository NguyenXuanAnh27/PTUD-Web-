const express = require('express');
const statisticController = require('../controllers/statistic.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

const router = express.Router();

// Tất cả API thống kê chỉ dành cho Admin
router.use(authenticate, authorize('admin'));

router.get('/overview', statisticController.getOverview);
router.get('/revenue', statisticController.getMonthlyRevenue);
router.get('/orders-by-day', statisticController.getOrdersByDay);
router.get('/top-products', statisticController.getTopProducts);
router.get('/category-distribution', statisticController.getCategoryDistribution);

module.exports = router;

