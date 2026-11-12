const { sql, getPool } = require('../config/db');

const SAFE_USER_FIELDS = `
  Id, Username, Email, FullName, Phone, Role, IsActive, CreatedAt, UpdatedAt
`;

const findByUsername = async (username) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('username', sql.NVarChar(50), username)
    .query(`SELECT * FROM dbo.Users WHERE Username = @username`);
  return result.recordset[0] || null;
};

const findByEmail = async (email) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.NVarChar(100), email)
    .query(`SELECT * FROM dbo.Users WHERE Email = @email`);
  return result.recordset[0] || null;
};

const findByUsernameOrEmail = async (username, email) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('username', sql.NVarChar(50), username)
    .input('email', sql.NVarChar(100), email)
    .query(`
      SELECT ${SAFE_USER_FIELDS}
      FROM dbo.Users
      WHERE Username = @username OR Email = @email
    `);
  return result.recordset[0] || null;
};

const findById = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`SELECT ${SAFE_USER_FIELDS} FROM dbo.Users WHERE Id = @id`);
  return result.recordset[0] || null;
};

const findByIdWithPassword = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`SELECT * FROM dbo.Users WHERE Id = @id`);
  return result.recordset[0] || null;
};

const create = async ({ username, email, passwordHash, fullName, phone = null, role = 'customer' }) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('username', sql.NVarChar(50), username)
    .input('email', sql.NVarChar(100), email)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .input('fullName', sql.NVarChar(100), fullName)
    .input('phone', sql.NVarChar(20), phone)
    .input('role', sql.NVarChar(20), role)
    .query(`
      INSERT INTO dbo.Users (Username, Email, PasswordHash, FullName, Phone, Role)
      OUTPUT INSERTED.Id, INSERTED.Username, INSERTED.Email, INSERTED.FullName,
             INSERTED.Phone, INSERTED.Role, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
      VALUES (@username, @email, @passwordHash, @fullName, @phone, @role)
    `);
  return result.recordset[0];
};

const updateProfile = async (id, { fullName, phone }) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('fullName', sql.NVarChar(100), fullName)
    .input('phone', sql.NVarChar(20), phone || null)
    .query(`
      UPDATE dbo.Users
      SET FullName = @fullName,
          Phone = @phone,
          UpdatedAt = GETDATE()
      OUTPUT INSERTED.Id, INSERTED.Username, INSERTED.Email, INSERTED.FullName,
             INSERTED.Phone, INSERTED.Role, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
      WHERE Id = @id
    `);
  return result.recordset[0] || null;
};

const updatePassword = async (id, passwordHash) => {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .query(`
      UPDATE dbo.Users
      SET PasswordHash = @passwordHash,
          UpdatedAt = GETDATE()
      WHERE Id = @id
    `);
};

const findAll = async ({ keyword, role, isActive, offset, limit }) => {
  const pool = await getPool();
  const request = pool.request();

  const conditions = ['1 = 1'];

  if (keyword) {
    request.input('keyword', sql.NVarChar(150), `%${keyword}%`);
    conditions.push('(Username LIKE @keyword OR FullName LIKE @keyword OR Email LIKE @keyword)');
  }
  if (role) {
    request.input('role', sql.NVarChar(20), role);
    conditions.push('Role = @role');
  }
  if (typeof isActive === 'boolean') {
    request.input('isActive', sql.Bit, isActive ? 1 : 0);
    conditions.push('IsActive = @isActive');
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await request.query(`
    SELECT COUNT(*) AS TotalItems
    FROM dbo.Users
    WHERE ${whereClause}
  `);
  const totalItems = countResult.recordset[0].TotalItems;

  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const dataResult = await request.query(`
    SELECT ${SAFE_USER_FIELDS}
    FROM dbo.Users
    WHERE ${whereClause}
    ORDER BY CreatedAt DESC, Id DESC
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return {
    items: dataResult.recordset,
    totalItems
  };
};

const updateStatus = async (id, isActive) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('isActive', sql.Bit, isActive ? 1 : 0)
    .query(`
      UPDATE dbo.Users
      SET IsActive = @isActive,
          UpdatedAt = GETDATE()
      OUTPUT INSERTED.Id, INSERTED.Username, INSERTED.Email, INSERTED.FullName,
             INSERTED.Phone, INSERTED.Role, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
      WHERE Id = @id
    `);
  return result.recordset[0] || null;
};

const updateRole = async (id, role) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('role', sql.NVarChar(20), role)
    .query(`
      UPDATE dbo.Users
      SET Role = @role,
          UpdatedAt = GETDATE()
      OUTPUT INSERTED.Id, INSERTED.Username, INSERTED.Email, INSERTED.FullName,
             INSERTED.Phone, INSERTED.Role, INSERTED.IsActive, INSERTED.CreatedAt, INSERTED.UpdatedAt
      WHERE Id = @id
    `);
  return result.recordset[0] || null;
};

// Lưu token đã đăng xuất vào bảng TokenBlacklist
const blacklistToken = async (token, expiresAt) => {
  const pool = await getPool();
  await pool
    .request()
    .input('token', sql.NVarChar(500), token)
    .input('expiresAt', sql.DateTime2, expiresAt)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.TokenBlacklist WHERE Token = @token)
      BEGIN
        INSERT INTO dbo.TokenBlacklist (Token, ExpiresAt)
        VALUES (@token, @expiresAt)
      END
    `);
};

const isTokenBlacklisted = async (token) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('token', sql.NVarChar(500), token)
    .query(`SELECT 1 AS Found FROM dbo.TokenBlacklist WHERE Token = @token`);
  return result.recordset.length > 0;
};

module.exports = {
  findByUsername,
  findByEmail,
  findByUsernameOrEmail,
  findById,
  findByIdWithPassword,
  create,
  updateProfile,
  updatePassword,
  findAll,
  updateStatus,
  updateRole,
  blacklistToken,
  isTokenBlacklisted
};

