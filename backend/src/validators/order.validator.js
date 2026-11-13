const { body, param } = require('express-validator');

const orderIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID đơn hàng không hợp lệ')
];

const createOrderValidator = [
  body('customerName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên khách hàng phải từ 2 đến 100 ký tự'),

  body('customerPhone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[0-9+\-\s]{8,15}$/)
    .withMessage('Số điện thoại không hợp lệ'),

  body('note')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Ghi chú tối đa 500 ký tự'),

  body('items')
    .isArray({ min: 1, max: 50 })
    .withMessage('Đơn hàng phải có từ 1 đến 50 dòng món'),

  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('productId của mỗi món phải là số nguyên dương'),

  body('items.*.quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Số lượng mỗi món phải từ 1 đến 100')
];

const updateOrderStatusValidator = [
  ...orderIdValidator,
  body('status')
    .isIn(['pending', 'confirmed', 'completed', 'cancelled'])
    .withMessage('Trạng thái đơn chỉ nhận: pending, confirmed, completed, cancelled')
];

module.exports = {
  orderIdValidator,
  createOrderValidator,
  updateOrderStatusValidator
};

