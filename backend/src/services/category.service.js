const ApiError = require('../utils/ApiError');
const categoryRepository = require('../repositories/category.repository');

const listCategories = async () => {
  return categoryRepository.findAll();
};

const getCategoryById = async (id) => {
  const category = await categoryRepository.findById(id);
  if (!category) {
    throw new ApiError(404, 'Không tìm thấy danh mục');
  }
  return category;
};

const createCategory = async ({ name, code, description, sortOrder }) => {
  const normalizedCode = code.trim().toUpperCase();
  const normalizedName = name.trim();

  const duplicate = await categoryRepository.findByCodeOrName(normalizedCode, normalizedName);
  if (duplicate) {
    throw new ApiError(409, 'Tên hoặc mã danh mục đã tồn tại');
  }

  return categoryRepository.create({
    name: normalizedName,
    code: normalizedCode,
    description: description ? description.trim() : null,
    sortOrder: sortOrder ?? 0
  });
};

const updateCategory = async (id, { name, code, description, sortOrder, isActive }) => {
  const existing = await categoryRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Không tìm thấy danh mục');
  }

  const normalizedCode = code.trim().toUpperCase();
  const normalizedName = name.trim();

  const duplicate = await categoryRepository.findByCodeOrName(normalizedCode, normalizedName, id);
  if (duplicate) {
    throw new ApiError(409, 'Tên hoặc mã danh mục đã bị trùng với danh mục khác');
  }

  return categoryRepository.update(id, {
    name: normalizedName,
    code: normalizedCode,
    description: description !== undefined ? description : existing.Description,
    sortOrder: sortOrder !== undefined ? sortOrder : existing.SortOrder,
    isActive: isActive !== undefined ? isActive : existing.IsActive
  });
};

const deleteCategory = async (id) => {
  const existing = await categoryRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Không tìm thấy danh mục');
  }

  const productCount = await categoryRepository.countProducts(id);
  if (productCount > 0) {
    throw new ApiError(409, `Không thể xóa danh mục đang có ${productCount} sản phẩm`);
  }

  await categoryRepository.remove(id);
};

module.exports = {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

