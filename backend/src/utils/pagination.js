/**
 * Tiện ích xử lý phân trang thống nhất cho các API danh sách
 */

const parsePagination = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const buildPaginationMeta = (page, limit, totalItems) => {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return {
    page,
    limit,
    totalItems,
    totalPages
  };
};

module.exports = {
  parsePagination,
  buildPaginationMeta
};

