const express = require('express');
const categoryController = require('../controllers/category.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  categoryIdValidator,
  createCategoryValidator,
  updateCategoryValidator
} = require('../validators/category.validator');

const router = express.Router();

// Public
router.get('/', categoryController.listCategories);
router.get('/:id', categoryIdValidator, validate, categoryController.getCategoryById);

// Admin only
router.post('/', authenticate, authorize('admin'), createCategoryValidator, validate, categoryController.createCategory);
router.put('/:id', authenticate, authorize('admin'), updateCategoryValidator, validate, categoryController.updateCategory);
router.delete('/:id', authenticate, authorize('admin'), categoryIdValidator, validate, categoryController.deleteCategory);

module.exports = router;

