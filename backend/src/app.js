const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// 1. Bảo mật HTTP headers
app.use(helmet());

// 2. Cấu hình CORS cho phép Frontend gọi API
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép request không có origin (Postman, curl, mở file:// trực tiếp) hoặc nằm trong danh sách cho phép
      if (!origin || origin === 'null' || env.corsOrigin.includes('*') || env.corsOrigin.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} không được phép bởi CORS`));
    },
    credentials: true
  })
);

// 3. Logging HTTP requests
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// 4. Parse JSON & URL-encoded body
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 5. Mount toàn bộ RESTful API dưới prefix /api
app.use('/api', routes);

// 6. Xử lý 404 & tập trung hóa xử lý lỗi
app.use(notFound);
app.use(errorHandler);

module.exports = app;

