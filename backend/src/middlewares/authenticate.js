const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');

/**
 * Middleware xác thực JWT Access Token
 * 1. Lấy token từ header Authorization: Bearer <token>
 * 2. Kiểm tra token có nằm trong danh sách đã đăng xuất (TokenBlacklist) không
 * 3. Verify chữ ký JWT & hạn sử dụng
 * 4. Kiểm tra tài khoản còn tồn tại và đang hoạt động (IsActive = 1)
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Vui lòng đăng nhập để truy cập (thiếu token)'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new ApiError(401, 'Token xác thực không hợp lệ'));
    }

    // Kiểm tra token đã bị thu hồi khi đăng xuất chưa
    const blacklisted = await userRepository.isTokenBlacklisted(token);
    if (blacklisted) {
      return next(new ApiError(401, 'Phiên đăng nhập đã kết thúc, vui lòng đăng nhập lại'));
    }

    const decoded = jwt.verify(token, env.jwt.secret);

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      return next(new ApiError(401, 'Tài khoản không còn tồn tại'));
    }

    if (!user.IsActive) {
      return next(new ApiError(403, 'Tài khoản của bạn đã bị khóa bởi quản trị viên'));
    }

    req.user = {
      id: user.Id,
      username: user.Username,
      email: user.Email,
      fullName: user.FullName,
      role: user.Role
    };
    req.token = token;
    req.tokenExp = decoded.exp;

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = authenticate;

