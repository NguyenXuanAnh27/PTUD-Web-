const express = require('express');
const orderController = require('../controllers/order.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  orderIdValidator,
  createOrderValidator,
  updateOrderStatusValidator
} = require('../validators/order.validator');

const router = express.Router();

// Tất cả API đơn hàng yêu cầu đăng nhập
router.use(authenticate);

// Đặt trước /:id để tránh xung đột route
router.get('/my-orders', orderController.listMyOrders);

router.post('/', createOrderValidator, validate, orderController.createOrder);
router.get('/', authorize('admin'), orderController.listAllOrders);
router.get('/:id', orderIdValidator, validate, orderController.getOrderById);
router.patch('/:id/status', authorize('admin'), updateOrderStatusValidator, validate, orderController.updateOrderStatus);
router.patch('/:id/cancel', orderIdValidator, validate, orderController.cancelMyOrder);

module.exports = router;

