const { body, param } = require('express-validator');

const updateProfileValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Họ và tên không được để trống')
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ và tên phải từ 2 đến 100 ký tự'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[0-9+\-\s]{8,15}$/)
    .withMessage('Số điện thoại không hợp lệ')
];

const changePasswordValidator = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Vui lòng nhập mật khẩu hiện tại'),

  body('newPassword')
    .notEmpty()
    .withMessage('Vui lòng nhập mật khẩu mới')
    .isLength({ min: 6, max: 100 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
];

const updateStatusValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID người dùng không hợp lệ'),
  body('isActive')
    .isBoolean()
    .withMessage('Trạng thái isActive phải là giá trị boolean (true/false)')
];

const updateRoleValidator = [
  param('id').isInt({ min: 1 }).withMessage('ID người dùng không hợp lệ'),
  body('role')
    .isIn(['admin', 'customer'])
    .withMessage('Vai trò chỉ nhận giá trị "admin" hoặc "customer"')
];

module.exports = {
  updateProfileValidator,
  changePasswordValidator,
  updateStatusValidator,
  updateRoleValidator
};

