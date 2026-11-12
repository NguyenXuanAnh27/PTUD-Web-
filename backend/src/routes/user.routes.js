const express = require('express');
const userController = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const {
  updateProfileValidator,
  changePasswordValidator,
  updateStatusValidator,
  updateRoleValidator
} = require('../validators/user.validator');

const router = express.Router();

// Tất cả route users đều yêu cầu đăng nhập
router.use(authenticate);

// Route cá nhân (đặt trước route có tham số :id)
router.get('/me', userController.getMe);
router.put('/me', updateProfileValidator, validate, userController.updateMe);
router.put('/me/password', changePasswordValidator, validate, userController.changePassword);

// Route quản trị người dùng (chỉ Admin)
router.get('/', authorize('admin'), userController.listUsers);
router.patch('/:id/status', authorize('admin'), updateStatusValidator, validate, userController.updateUserStatus);
router.patch('/:id/role', authorize('admin'), updateRoleValidator, validate, userController.updateUserRole);

module.exports = router;

