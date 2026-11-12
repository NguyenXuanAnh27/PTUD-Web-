/**
 * Bọc các hàm async controller để tự động bắt lỗi Promise reject
 * và chuyển tiếp sang middleware errorHandler qua next(err)
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

