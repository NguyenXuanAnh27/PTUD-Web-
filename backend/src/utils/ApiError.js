/**
 * Lớp lỗi chuẩn hóa cho toàn bộ ứng dụng Backend
 * Giúp phân biệt lỗi nghiệp vụ có chủ đích với lỗi hệ thống không mong muốn (500)
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode Mã HTTP status (400, 401, 403, 404, 409, 422, 500...)
   * @param {string} message Thông báo lỗi thân thiện cho client
   * @param {Array<{field: string, message: string}>} [errors] Danh sách lỗi chi tiết theo từng trường
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;

