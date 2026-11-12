const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHelper');
const userService = require('../services/user.service');

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getMyProfile(req.user.id);
  return sendSuccess(res, 200, 'Lấy thông tin cá nhân thành công', user);
});

const updateMe = asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  const user = await userService.updateMyProfile(req.user.id, { fullName, phone });
  return sendSuccess(res, 200, 'Cập nhật hồ sơ thành công', user);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await userService.changeMyPassword(req.user.id, { currentPassword, newPassword });
  return sendSuccess(res, 200, 'Đổi mật khẩu thành công', null);
});

const listUsers = asyncHandler(async (req, res) => {
  const { items, pagination } = await userService.listUsers(req.query);
  const message =
    items.length === 0 ? 'Không tìm thấy người dùng nào phù hợp' : 'Lấy danh sách người dùng thành công';
  return sendSuccess(res, 200, message, items, { pagination });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const { isActive } = req.body;
  const user = await userService.updateUserStatus(targetId, req.user.id, isActive);
  return sendSuccess(
    res,
    200,
    isActive ? 'Đã mở khóa tài khoản thành công' : 'Đã khóa tài khoản thành công',
    user
  );
});

const updateUserRole = asyncHandler(async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const { role } = req.body;
  const user = await userService.updateUserRole(targetId, req.user.id, role);
  return sendSuccess(res, 200, 'Cập nhật vai trò người dùng thành công', user);
});

module.exports = {
  getMe,
  updateMe,
  changePassword,
  listUsers,
  updateUserStatus,
  updateUserRole
};

