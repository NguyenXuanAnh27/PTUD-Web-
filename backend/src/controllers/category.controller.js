const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHelper');
const categoryService = require('../services/category.service');

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories();
  const message =
    categories.length === 0 ? 'Chưa có danh mục nào' : 'Lấy danh sách danh mục thành công';
  return sendSuccess(res, 200, message, categories);
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(parseInt(req.params.id, 10));
  return sendSuccess(res, 200, 'Lấy chi tiết danh mục thành công', category);
});

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);
  return sendSuccess(res, 201, 'Thêm danh mục mới thành công', category);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(parseInt(req.params.id, 10), req.body);
  return sendSuccess(res, 200, 'Cập nhật danh mục thành công', category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(parseInt(req.params.id, 10));
  return sendSuccess(res, 200, 'Xóa danh mục thành công', null);
});

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

