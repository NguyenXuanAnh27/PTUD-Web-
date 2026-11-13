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

  const productData = {
    name: name.trim(),
    categoryId,
    price,
    status: status || 'available',
    image: image ? image.trim() : null,
    description: description ? description.trim() : null
  };

  const manualCode = code ? code.trim().toUpperCase() : '';
  if (manualCode) {
    const duplicate = await productRepository.findByCode(manualCode);
    if (duplicate) {
      throw new ApiError(409, `Mã sản phẩm "${manualCode}" đã tồn tại`, [
        { field: 'code', message: 'Mã sản phẩm đã tồn tại' }
      ]);
    }
    return productRepository.create({ ...productData, code: manualCode });
  }

  // Mã tự sinh có thể trùng nếu 2 admin tạo món cùng lúc => sinh lại và thử lại
  for (let attempt = 1; ; attempt += 1) {
    const autoCode = await productRepository.generateNextCode(category.Code || 'TU');
    try {
      return await productRepository.create({ ...productData, code: autoCode });
    } catch (err) {
      const isDuplicate = err.number === 2627 || err.number === 2601;
      if (!isDuplicate || attempt >= 3) throw err;
    }
  }
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
    // Chuỗi rỗng => xóa (NULL), giống hành vi của createProduct; có giá trị thì trim
    image: image !== undefined ? (image ? image.trim() : null) : existing.Image,
    description: description !== undefined ? (description ? description.trim() : null) : existing.Description
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

