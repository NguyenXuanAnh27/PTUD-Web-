const dotenv = require('dotenv');
const path = require('path');

// Tải biến môi trường từ file .env ở thư mục backend
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const DEV_FALLBACK_JWT_SECRET = 'dev_fallback_secret_please_change_in_env';

// Môi trường production bắt buộc phải có JWT_SECRET riêng (đủ dài),
// tránh việc chạy bằng secret mặc định công khai khiến ai cũng giả mạo được token.
if (nodeEnv === 'production') {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === DEV_FALLBACK_JWT_SECRET || secret.length < 32) {
    throw new Error('Thiếu hoặc JWT_SECRET quá yếu (cần >= 32 ký tự) khi chạy NODE_ENV=production');
  }
}

const env = {
  nodeEnv,
  port: parseInt(process.env.PORT, 10) || 5000,
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5500', 'http://127.0.0.1:5500'],

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    instance: process.env.DB_INSTANCE || '',
    database: process.env.DB_NAME || 'TuloCoffeeDB',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    trustedConnection: process.env.DB_TRUSTED_CONNECTION === 'true'
  },

  jwt: {
    secret: process.env.JWT_SECRET || DEV_FALLBACK_JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
};

module.exports = env;

