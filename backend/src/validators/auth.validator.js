const { body } = require('express-validator');

const registerValidator = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Tên đăng nhập không được để trống')
    .isLength({ min: 3, max: 50 })
    .withMessage('Tên đăng nhập phải từ 3 đến 50 ký tự')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email không được để trống')
    .isEmail()
    .withMessage('Định dạng email không hợp lệ')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống')
    .isLength({ min: 6, max: 100 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),

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

const loginValidator = [
  body('usernameOrEmail')
    .trim()
    .notEmpty()
    .withMessage('Vui lòng nhập tên đăng nhập hoặc email')
    // Email lúc đăng ký đã được normalizeEmail() (vd: A.B@gmail.com -> ab@gmail.com),
    // nên lúc đăng nhập cũng phải chuẩn hóa tương tự thì mới khớp với dữ liệu đã lưu.
    // Username không chứa ký tự "@" nên không bị ảnh hưởng.
    .if(body('usernameOrEmail').isEmail())
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Vui lòng nhập mật khẩu')
];

module.exports = {
  registerValidator,
  loginValidator
};

