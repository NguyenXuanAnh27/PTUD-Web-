const express = require('express');
const { sendSuccess } = require('../utils/responseHelper');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const categoryRoutes = require('./category.routes');
const productRoutes = require('./product.routes');
const orderRoutes = require('./order.routes');
const statisticRoutes = require('./statistic.routes');

const router = express.Router();

router.get('/health', (req, res) => {
  return sendSuccess(res, 200, 'Tulo Coffee API đang hoạt động ổn định', {
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/statistics', statisticRoutes);

module.exports = router;

