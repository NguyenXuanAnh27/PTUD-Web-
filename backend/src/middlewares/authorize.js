const ApiError = require('../utils/ApiError');

/**
 * Middleware phân quyền theo vai trò (Role-Based Access Control)
 * Sử dụng sau middleware authenticate
 * @param  {...string} allowedRoles Danh sách role được phép truy cập (vd: 'admin', 'customer')
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Bạn chưa đăng nhập'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'Bạn không có quyền thực hiện chức năng này'));
  }

  return next();
};

module.exports = authorize;

