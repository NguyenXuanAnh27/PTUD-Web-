const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');

const SALT_ROUNDS = 10;

const formatUserResponse = (user) => ({
  id: user.Id,
  username: user.Username,
  email: user.Email,
  fullName: user.FullName,
  phone: user.Phone,
  role: user.Role,
  isActive: user.IsActive,
  createdAt: user.CreatedAt
});

const register = async ({ username, email, password, fullName, phone }) => {
  const existing = await userRepository.findByUsernameOrEmail(username, email);
  if (existing) {
    if (existing.Username.toLowerCase() === username.toLowerCase()) {
      throw new ApiError(409, 'Tên đăng nhập đã được sử dụng', [
        { field: 'username', message: 'Tên đăng nhập đã tồn tại' }
      ]);
    }
    throw new ApiError(409, 'Email đã được sử dụng', [
      { field: 'email', message: 'Email đã tồn tại' }
    ]);
  }

  // Băm mật khẩu với bcrypt salt rounds = 10
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Luôn gán mặc định role = 'customer' khi đăng ký để tránh leo thang đặc quyền
  const createdUser = await userRepository.create({
    username,
    email,
    passwordHash,
    fullName,
    phone,
    role: 'customer'
  });

  return formatUserResponse(createdUser);
};

const login = async ({ usernameOrEmail, password }) => {
  // Hỗ trợ đăng nhập bằng username hoặc email
  let user = await userRepository.findByUsername(usernameOrEmail);
  if (!user) {
    user = await userRepository.findByEmail(usernameOrEmail);
  }

  if (!user) {
    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không chính xác');
  }

  // Kiểm tra mật khẩu TRƯỚC khi báo khóa tài khoản, để người ngoài không dò được
  // tài khoản nào đang bị khóa chỉ bằng cách biết username.
  const isMatch = await bcrypt.compare(password, user.PasswordHash);
  if (!isMatch) {
    throw new ApiError(401, 'Tên đăng nhập hoặc mật khẩu không chính xác');
  }

  if (!user.IsActive) {
    throw new ApiError(403, 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên');
  }

  const token = jwt.sign(
    {
      id: user.Id,
      role: user.Role
    },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  return {
    token,
    user: formatUserResponse(user)
  };
};

const logout = async (token, tokenExp) => {
  const expiresAt = tokenExp ? new Date(tokenExp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
  await userRepository.blacklistToken(token, expiresAt);
};

module.exports = {
  register,
  login,
  logout,
  formatUserResponse
};

