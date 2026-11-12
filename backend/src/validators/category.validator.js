const { body, param } = require('express-validator');

const categoryIdValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID danh mục không hợp lệ')
];

const createCategoryValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tên danh mục không được để trống')
    .isLength({ min: 2, max: 100 })
    .withMessage('Tên danh mục phải từ 2 đến 100 ký tự'),

  body('code')
    .trim()
    .notEmpty()
    .withMessage('Mã danh mục không được để trống')
    .isLength({ min: 2, max: 10 })
    .withMessage('Mã danh mục phải từ 2 đến 10 ký tự')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Mã danh mục chỉ chứa chữ cái và số'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Mô tả tối đa 255 ký tự'),

  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Thứ tự hiển thị phải là số nguyên không âm')
];

const updateCategoryValidator = [
  ...categoryIdValidator,
  ...createCategoryValidator,
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive phải là kiểu boolean')
];

module.exports = {
  categoryIdValidator,
  createCategoryValidator,
  updateCategoryValidator
};

