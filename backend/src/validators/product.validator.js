const { body, param } = require('express-validator');

const productIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID sản phẩm không hợp lệ')
];

const createProductValidator = [
  body('code')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Mã sản phẩm phải từ 2 đến 20 ký tự')
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Mã sản phẩm chỉ được chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên món không được để trống')
    .isLength({ min: 2, max: 150 })
    .withMessage('Tên món phải từ 2 đến 150 ký tự'),

  body('categoryId')
    .notEmpty()
    .withMessage('Danh mục không được để trống')
    .isInt({ min: 1 })
    .withMessage('categoryId phải là số nguyên dương'),

  body('price')
    .notEmpty()
    .withMessage('Giá bán không được để trống')
    .isInt({ min: 1000, max: 10000000 })
    .withMessage('Giá bán phải là số nguyên từ 1.000 đến 10.000.000 VNĐ'),

  body('status')
    .optional()
    .isIn(['available', 'out_of_stock'])
    .withMessage('Trạng thái chỉ nhận "available" hoặc "out_of_stock"'),

  body('image')
    .optional({ values: 'falsy' })
    .trim()
    .isURL()
    .withMessage('Đường dẫn hình ảnh phải là URL hợp lệ'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mô tả tối đa 500 ký tự')
];

const updateProductValidator = [
  ...productIdValidator,
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên món không được để trống')
    .isLength({ min: 2, max: 150 })
    .withMessage('Tên món phải từ 2 đến 150 ký tự'),

  body('categoryId')
    .notEmpty()
    .withMessage('Danh mục không được để trống')
    .isInt({ min: 1 })
    .withMessage('categoryId phải là số nguyên dương'),

  body('price')
    .notEmpty()
    .withMessage('Giá bán không được để trống')
    .isInt({ min: 1000, max: 10000000 })
    .withMessage('Giá bán phải là số nguyên từ 1.000 đến 10.000.000 VNĐ'),

  body('status')
    .optional()
    .isIn(['available', 'out_of_stock'])
    .withMessage('Trạng thái chỉ nhận "available" hoặc "out_of_stock"'),

  body('image')
    .optional({ values: 'falsy' })
    .trim()
    .isURL()
    .withMessage('Đường dẫn hình ảnh phải là URL hợp lệ'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Mô tả tối đa 500 ký tự')
];

module.exports = {
  productIdValidator,
  createProductValidator,
  updateProductValidator
};

