/**
 * Chuẩn hóa format JSON trả về cho mọi API theo yêu cầu:
 * Thành công: { success: true, message: "...", data: ... }
 * Thất bại:   { success: false, message: "...", errors: [...] }
 */

const sendSuccess = (res, statusCode = 200, message = 'Thành công', data = null, extra = {}) => {
  const payload = {
    success: true,
    message,
    data,
    ...extra
  };
  return res.status(statusCode).json(payload);
};

const sendError = (res, statusCode = 500, message = 'Lỗi hệ thống', errors = []) => {
  const payload = {
    success: false,
    message
  };
  if (errors && errors.length > 0) {
    payload.errors = errors;
  }
  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
  sendError
};

