const express = require('express');
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const { registerValidator, loginValidator } = require('../validators/auth.validator');

const router = express.Router();

// Giới hạn số lần thử đăng nhập để chống tấn công Brute-force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: env.nodeEnv === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đã thử đăng nhập quá nhiều lần, vui lòng thử lại sau 15 phút'
  }
});

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginLimiter, loginValidator, validate, authController.login);
router.post('/logout', authenticate, authController.logout);

module.exports = router;

