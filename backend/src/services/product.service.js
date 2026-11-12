const ApiError = require('../utils/ApiError');
const productRepository = require('../repositories/product.repository');
const categoryRepository = require('../repositories/category.repository');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

const listProducts = async (query) => {
  const { page, limit, offset } = parsePagination(query);
  const { keyword, category, status, minPrice, maxPrice, sort } = query;

  const { items, totalItems } = await productRepository.findAll({
    keyword: keyword ? keyword.trim() : undefined,
    category,
    status,
    minPrice,
    maxPrice,
    sort,
    offset,
    limit
  });

  return {
    items,
    pagination: buildPaginationMeta(page, limit, totalItems)
  };
};

const getProductById = async (id) => {
  const product = await productRepository.findById(id);
  if (!product) {
    throw new ApiError(404, 'Không tìm thấy sản phẩm');
  }
  return product;
};

const createProduct = async ({ code, name, categoryId, price, status, image, description }) => {
  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new ApiError(404, 'Danh mục không tồn tại', [
      { field: 'categoryId', message: 'Danh mục không hợp lệ' }
    ]);
  }

  let productCode = code ? code.trim().toUpperCase() : '';
  if (!productCode) {
    productCode = await productRepository.generateNextCode(category.Code || 'TU');
  } else {
    const duplicate = await productRepository.findByCode(productCode);
    if (duplicate) {
      throw new ApiError(409, `Mã sản phẩm "${productCode}" đã tồn tại`, [
        { field: 'code', message: 'Mã sản phẩm đã tồn tại' }
      ]);
    }
  }

  return productRepository.create({
    code: productCode,
    name: name.trim(),
    categoryId,
    price,
    status: status || 'available',
    image: image ? image.trim() : null,
    description: description ? description.trim() : null
  });
};

const updateProduct = async (id, { name, categoryId, price, status, image, description }) => {
  const existing = await productRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Không tìm thấy sản phẩm');
  }

  const category = await categoryRepository.findById(categoryId);
  if (!category) {
    throw new ApiError(404, 'Danh mục không tồn tại', [
      { field: 'categoryId', message: 'Danh mục không hợp lệ' }
    ]);
  }

  return productRepository.update(id, {
    name: name.trim(),
    categoryId,
    price,
    status: status || existing.Status,
    image: image !== undefined ? image : existing.Image,
    description: description !== undefined ? description : existing.Description
  });
};

const deleteProduct = async (id) => {
  const deleted = await productRepository.softDelete(id);
  if (!deleted) {
    throw new ApiError(404, 'Không tìm thấy sản phẩm hoặc sản phẩm đã bị xóa');
  }
};

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

