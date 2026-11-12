const app = require('./app');
const env = require('./config/env');
const { getPool, closePool } = require('./config/db');

const startServer = async () => {
  try {
    // Kiểm tra kết nối SQL Server trước khi mở cổng HTTP
    await getPool();

    const server = app.listen(env.port, () => {
      console.log(`🚀 Tulo Coffee Backend đang chạy tại http://localhost:${env.port}`);
      console.log(`📌 Môi trường: ${env.nodeEnv}`);
    });

    // Đóng kết nối sạch sẽ khi dừng tiến trình
    const shutdown = async () => {
      console.log('\n🛑 Đang tắt server...');
      server.close(async () => {
        await closePool();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('❌ Không thể khởi động server:', err.message);
    process.exit(1);
  }
};

startServer();

