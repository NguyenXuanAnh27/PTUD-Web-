const { sql, getPool } = require('../config/db');

const findAll = async () => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT c.Id, c.Name, c.Code, c.Description, c.SortOrder, c.IsActive, c.CreatedAt,
           COUNT(CASE WHEN p.IsDeleted = 0 THEN p.Id END) AS ProductCount
    FROM dbo.Categories c
    LEFT JOIN dbo.Products p ON p.CategoryId = c.Id
    GROUP BY c.Id, c.Name, c.Code, c.Description, c.SortOrder, c.IsActive, c.CreatedAt
    ORDER BY c.SortOrder ASC, c.Id ASC
  `);
  return result.recordset;
};

const findById = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT c.Id, c.Name, c.Code, c.Description, c.SortOrder, c.IsActive, c.CreatedAt,
             COUNT(CASE WHEN p.IsDeleted = 0 THEN p.Id END) AS ProductCount
      FROM dbo.Categories c
      LEFT JOIN dbo.Products p ON p.CategoryId = c.Id
      WHERE c.Id = @id
      GROUP BY c.Id, c.Name, c.Code, c.Description, c.SortOrder, c.IsActive, c.CreatedAt
    `);
  return result.recordset[0] || null;
};

const findByCodeOrName = async (code, name, excludeId = null) => {
  const pool = await getPool();
  const request = pool
    .request()
    .input('code', sql.NVarChar(10), code)
    .input('name', sql.NVarChar(100), name);

  let queryStr = `
    SELECT Id, Name, Code
    FROM dbo.Categories
    WHERE (Code = @code OR Name = @name)
  `;

  if (excludeId) {
    request.input('excludeId', sql.Int, excludeId);
    queryStr += ' AND Id <> @excludeId';
  }

  const result = await request.query(queryStr);
  return result.recordset[0] || null;
};

const create = async ({ name, code, description = null, sortOrder = 0 }) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('name', sql.NVarChar(100), name)
    .input('code', sql.NVarChar(10), code.toUpperCase())
    .input('description', sql.NVarChar(255), description)
    .input('sortOrder', sql.Int, sortOrder)
    .query(`
      INSERT INTO dbo.Categories (Name, Code, Description, SortOrder)
      OUTPUT INSERTED.*
      VALUES (@name, @code, @description, @sortOrder)
    `);
  return result.recordset[0];
};

const update = async (id, { name, code, description, sortOrder, isActive }) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar(100), name)
    .input('code', sql.NVarChar(10), code.toUpperCase())
    .input('description', sql.NVarChar(255), description ?? null)
    .input('sortOrder', sql.Int, sortOrder ?? 0)
    .input('isActive', sql.Bit, isActive !== undefined ? (isActive ? 1 : 0) : 1)
    .query(`
      UPDATE dbo.Categories
      SET Name = @name,
          Code = @code,
          Description = @description,
          SortOrder = @sortOrder,
          IsActive = @isActive
      OUTPUT INSERTED.*
      WHERE Id = @id
    `);
  return result.recordset[0] || null;
};

const countProducts = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT COUNT(*) AS Total
      FROM dbo.Products
      WHERE CategoryId = @id AND IsDeleted = 0
    `);
  return result.recordset[0].Total;
};

const remove = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`DELETE FROM dbo.Categories WHERE Id = @id`);
  return result.rowsAffected[0] > 0;
};

module.exports = {
  findAll,
  findById,
  findByCodeOrName,
  create,
  update,
  countProducts,
  remove
};

