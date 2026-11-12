const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const userRepository = require('../repositories/user.repository');
const { formatUserResponse } = require('./auth.service');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const SALT_ROUNDS = 10;

const getMyProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy thông tin tài khoản');
  }
  return formatUserResponse(user);
};

const updateMyProfile = async (userId, { fullName, phone }) => {
  const updated = await userRepository.updateProfile(userId, { fullName, phone });
  if (!updated) {
    throw new ApiError(404, 'Không tìm thấy thông tin tài khoản');
  }
  return formatUserResponse(updated);
};

const changeMyPassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) {
    throw new ApiError(404, 'Không tìm thấy thông tin tài khoản');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.PasswordHash);
  if (!isMatch) {
    throw new ApiError(400, 'Mật khẩu hiện tại không chính xác', [
      { field: 'currentPassword', message: 'Mật khẩu hiện tại không đúng' }
    ]);
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, 'Mật khẩu mới không được trùng với mật khẩu cũ', [
      { field: 'newPassword', message: 'Vui lòng chọn mật khẩu khác mật khẩu hiện tại' }
    ]);
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepository.updatePassword(userId, newHash);
};

const listUsers = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { keyword, role, isActive } = query;

  let activeFilter;
  if (isActive === 'true' || isActive === '1') activeFilter = true;
  if (isActive === 'false' || isActive === '0') activeFilter = false;

  const { items, totalItems } = await userRepository.findAll({
    keyword: keyword ? keyword.trim() : undefined,
    role: role && role !== 'all' ? role : undefined,
    isActive: activeFilter,
    offset,
    limit
  });

  return {
    items: items.map(formatUserResponse),
    pagination: buildPaginationMeta(page, limit, totalItems)
  };
};

const updateUserStatus = async (targetUserId, currentAdminId, isActive) => {
  if (targetUserId === currentAdminId && !isActive) {
    throw new ApiError(400, 'Không thể tự khóa tài khoản quản trị đang đăng nhập');
  }

  const existing = await userRepository.findById(targetUserId);
  if (!existing) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  const updated = await userRepository.updateStatus(targetUserId, isActive);
  return formatUserResponse(updated);
};

const updateUserRole = async (targetUserId, currentAdminId, role) => {
  if (targetUserId === currentAdminId && role !== 'admin') {
    throw new ApiError(400, 'Không thể tự hạ quyền tài khoản quản trị đang đăng nhập');
  }

  const existing = await userRepository.findById(targetUserId);
  if (!existing) {
    throw new ApiError(404, 'Không tìm thấy người dùng');
  }

  const updated = await userRepository.updateRole(targetUserId, role);
  return formatUserResponse(updated);
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  listUsers,
  updateUserStatus,
  updateUserRole
};

