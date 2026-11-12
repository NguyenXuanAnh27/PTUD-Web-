const env = require('./env');

// Chọn driver phù hợp: mặc định dùng mssql (tedious - TCP/IP),
// nếu DB_TRUSTED_CONNECTION=true thì dùng mssql/msnodesqlv8 (Windows Auth qua ODBC)
const sql = env.db.trustedConnection ? require('mssql/msnodesqlv8') : require('mssql');

let poolPromise = null;

/**
 * Xây dựng cấu hình kết nối SQL Server
 */
const buildDbConfig = () => {
  if (env.db.trustedConnection) {
    const serverTarget = env.db.instance
      ? `${env.db.host}\\${env.db.instance}`
      : env.db.host;
    return {
      connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${serverTarget};Database=${env.db.database};Trusted_Connection=Yes;TrustServerCertificate=Yes;`
    };
  }

  const config = {
    server: env.db.host,
    database: env.db.database,
    user: env.db.user,
    password: env.db.password,
    options: {
      encrypt: env.db.encrypt,
      trustServerCertificate: env.db.trustServerCertificate
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };

  if (env.db.instance) {
    config.options.instanceName = env.db.instance;
  } else {
    config.port = env.db.port;
  }

  return config;
};

/**
 * Lấy hoặc khởi tạo Connection Pool tới SQL Server (Singleton)
 * @returns {Promise<sql.ConnectionPool>}
 */
const getPool = async () => {
  if (!poolPromise) {
    const config = buildDbConfig();
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        if (env.nodeEnv !== 'test') {
          console.log(`✅ Kết nối SQL Server thành công (Database: ${env.db.database})`);
        }
        return pool;
      })
      .catch((err) => {
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
};

/**
 * Đóng pool kết nối (dùng khi tắt server hoặc kết thúc test)
 */
const closePool = async () => {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.close();
    poolPromise = null;
  }
};

module.exports = {
  sql,
  getPool,
  closePool
};

