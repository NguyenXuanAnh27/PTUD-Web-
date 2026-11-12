const ApiError = require('../utils/ApiError');

/**
 * Middleware bắt các route không tồn tại và chuyển sang errorHandler với mã 404
 */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Không tìm thấy đường dẫn: ${req.method} ${req.originalUrl}`));
};

module.exports = notFound;

