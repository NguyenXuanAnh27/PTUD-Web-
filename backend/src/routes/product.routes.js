const express = require('express');
const productController = require('../controllers/product.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  productIdValidator,
  createProductValidator,
  updateProductValidator
} = require('../validators/product.validator');

const router = express.Router();

// Public: tìm kiếm (?keyword=), lọc (?category=&status=), phân trang (?page=&limit=)
router.get('/', productController.listProducts);
router.get('/:id', productIdValidator, validate, productController.getProductById);

// Admin only: thêm, sửa, xóa mềm sản phẩm
router.post('/', authenticate, authorize('admin'), createProductValidator, validate, productController.createProduct);
router.put('/:id', authenticate, authorize('admin'), updateProductValidator, validate, productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productIdValidator, validate, productController.deleteProduct);

module.exports = router;

