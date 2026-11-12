const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Middleware gom lỗi validation từ express-validator
 * Nếu có lỗi, trả về HTTP 400 với danh sách lỗi theo từng trường { field, message }
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array({ onlyFirstError: true }).map((err) => ({
    field: err.path || err.param || 'unknown',
    message: err.msg
  }));

  return next(new ApiError(400, 'Dữ liệu đầu vào không hợp lệ', errors));
};

module.exports = validate;

