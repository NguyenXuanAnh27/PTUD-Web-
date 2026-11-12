const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { sendError } = require('../utils/responseHelper');

/**
 * Middleware xử lý lỗi tập trung cho toàn bộ ứng dụng
 * Đảm bảo lỗi DB/API không làm sập server và không lộ stack trace ra client
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ nội bộ';
  let errors = err.errors || [];

  // Xử lý các mã lỗi đặc trưng của SQL Server (mssql)
  if (err.number === 2627 || err.number === 2601) {
    // Vi phạm ràng buộc UNIQUE hoặc PRIMARY KEY
    statusCode = 409;
    message = 'Dữ liệu đã tồn tại trong hệ thống (trùng khóa duy nhất)';
  } else if (err.number === 547) {
    // Vi phạm FOREIGN KEY hoặc CHECK constraint
    statusCode = 400;
    message = 'Dữ liệu không hợp lệ hoặc đang được liên kết bởi bản ghi khác';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token xác thực không hợp lệ';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Định dạng JSON trong request body không hợp lệ';
  } else if (!(err instanceof ApiError) && statusCode === 500) {
    // Ẩn chi tiết lỗi hệ thống / SQL nội bộ khỏi client
    message = 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau';
  }

  // Ghi log ở server phục vụ debug (không trả stack trace về client)
  if (statusCode >= 500 && env.nodeEnv !== 'test') {
    console.error('❌ [Server Error]:', err);
  }

  return sendError(res, statusCode, message, errors);
};

module.exports = errorHandler;

