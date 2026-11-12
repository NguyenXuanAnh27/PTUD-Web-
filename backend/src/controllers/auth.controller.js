const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHelper');
const authService = require('../services/auth.service');

const register = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, phone } = req.body;
  const user = await authService.register({ username, email, password, fullName, phone });
  return sendSuccess(res, 201, 'Đăng ký tài khoản thành công', user);
});

const login = asyncHandler(async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  const result = await authService.login({ usernameOrEmail, password });
  return sendSuccess(res, 200, 'Đăng nhập thành công', result);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.token, req.tokenExp);
  return sendSuccess(res, 200, 'Đăng xuất thành công', null);
});

module.exports = {
  register,
  login,
  logout
};

