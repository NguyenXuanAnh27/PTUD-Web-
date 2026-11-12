const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/responseHelper');
const productService = require('../services/product.service');

const listProducts = asyncHandler(async (req, res) => {
  const { items, pagination } = await productService.listProducts(req.query);
  const message =
    items.length === 0 ? 'Không tìm thấy món nào phù hợp' : 'Lấy danh sách thực đơn thành công';
  return sendSuccess(res, 200, message, items, { pagination });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(parseInt(req.params.id, 10));
  return sendSuccess(res, 200, 'Lấy chi tiết sản phẩm thành công', product);
});

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  return sendSuccess(res, 201, 'Thêm món mới vào thực đơn thành công', product);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(parseInt(req.params.id, 10), req.body);
  return sendSuccess(res, 200, 'Cập nhật sản phẩm thành công', product);
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(parseInt(req.params.id, 10));
  return sendSuccess(res, 200, 'Xóa sản phẩm thành công', null);
});

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

