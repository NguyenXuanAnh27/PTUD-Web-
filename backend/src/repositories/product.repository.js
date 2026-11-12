const { sql, getPool } = require('../config/db');

// Whitelist cột sắp xếp để chống SQL Injection qua ORDER BY
const SORT_MAP = {
  newest: 'p.CreatedAt DESC, p.Id DESC',
  'name-asc': 'p.Name ASC',
  'price-asc': 'p.Price ASC, p.Id ASC',
  'price-desc': 'p.Price DESC, p.Id DESC'
};

const findAll = async ({ keyword, category, status, minPrice, maxPrice, sort = 'newest', offset, limit }) => {
  const pool = await getPool();
  const request = pool.request();

  const conditions = ['p.IsDeleted = 0'];

  // Tìm kiếm theo >= 2 trường: Tên món (Name), Mã món (Code), Mô tả (Description)
  if (keyword) {
    request.input('keyword', sql.NVarChar(150), `%${keyword}%`);
    conditions.push('(p.Name LIKE @keyword OR p.Code LIKE @keyword OR p.Description LIKE @keyword)');
  }

  // Lọc theo danh mục: hỗ trợ cả CategoryId (số), Category Code (CF), hoặc Category Name (Cà phê)
  if (category && category !== 'all') {
    const numericCat = Number(category);
    if (Number.isInteger(numericCat) && numericCat > 0) {
      request.input('categoryId', sql.Int, numericCat);
      conditions.push('p.CategoryId = @categoryId');
    } else {
      request.input('categoryFilter', sql.NVarChar(100), category);
      conditions.push('(c.Name = @categoryFilter OR c.Code = @categoryFilter)');
    }
  }

  // Lọc theo trạng thái
  if (status && status !== 'all') {
    request.input('status', sql.NVarChar(20), status);
    conditions.push('p.Status = @status');
  }

  // Lọc theo khoảng giá
  if (minPrice !== undefined && !Number.isNaN(Number(minPrice))) {
    request.input('minPrice', sql.Int, Number(minPrice));
    conditions.push('p.Price >= @minPrice');
  }
  if (maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) {
    request.input('maxPrice', sql.Int, Number(maxPrice));
    conditions.push('p.Price <= @maxPrice');
  }

  const whereClause = conditions.join(' AND ');
  const orderBy = SORT_MAP[sort] || SORT_MAP.newest;

  const countResult = await request.query(`
    SELECT COUNT(*) AS TotalItems
    FROM dbo.Products p
    INNER JOIN dbo.Categories c ON p.CategoryId = c.Id
    WHERE ${whereClause}
  `);
  const totalItems = countResult.recordset[0].TotalItems;

  request.input('offset', sql.Int, offset);
  request.input('limit', sql.Int, limit);

  const dataResult = await request.query(`
    SELECT p.Id, p.Code, p.Name, p.CategoryId, c.Name AS CategoryName, c.Code AS CategoryCode,
           p.Price, p.Status, p.Image, p.Description, p.CreatedAt, p.UpdatedAt
    FROM dbo.Products p
    INNER JOIN dbo.Categories c ON p.CategoryId = c.Id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
  `);

  return {
    items: dataResult.recordset,
    totalItems
  };
};

const findById = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      SELECT p.Id, p.Code, p.Name, p.CategoryId, c.Name AS CategoryName, c.Code AS CategoryCode,
             p.Price, p.Status, p.Image, p.Description, p.CreatedAt, p.UpdatedAt
      FROM dbo.Products p
      INNER JOIN dbo.Categories c ON p.CategoryId = c.Id
      WHERE p.Id = @id AND p.IsDeleted = 0
    `);
  return result.recordset[0] || null;
};

const findByCode = async (code, excludeId = null) => {
  const pool = await getPool();
  const request = pool.request().input('code', sql.NVarChar(20), code);
  let queryStr = 'SELECT Id, Code FROM dbo.Products WHERE Code = @code';
  if (excludeId) {
    request.input('excludeId', sql.Int, excludeId);
    queryStr += ' AND Id <> @excludeId';
  }
  const result = await request.query(queryStr);
  return result.recordset[0] || null;
};

/**
 * Tự động sinh mã món tiếp theo theo tiền tố danh mục (vd: CF005, TR005)
 */
const generateNextCode = async (prefix) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('pattern', sql.NVarChar(20), `${prefix}%`)
    .query(`
      SELECT Code
      FROM dbo.Products
      WHERE Code LIKE @pattern
    `);

  const regex = new RegExp(`^${prefix}(\\d+)$`, 'i');
  let maxNumber = 0;

  result.recordset.forEach((row) => {
    const match = row.Code.match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  });

  const nextNum = (maxNumber + 1).toString().padStart(3, '0');
  return `${prefix}${nextNum}`;
};

const create = async ({ code, name, categoryId, price, status = 'available', image = null, description = null }) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('code', sql.NVarChar(20), code.toUpperCase())
    .input('name', sql.NVarChar(150), name)
    .input('categoryId', sql.Int, categoryId)
    .input('price', sql.Int, price)
    .input('status', sql.NVarChar(20), status)
    .input('image', sql.NVarChar(500), image)
    .input('description', sql.NVarChar(500), description)
    .query(`
      INSERT INTO dbo.Products (Code, Name, CategoryId, Price, Status, Image, Description)
      OUTPUT INSERTED.Id
      VALUES (@code, @name, @categoryId, @price, @status, @image, @description)
    `);

  const insertedId = result.recordset[0].Id;
  return findById(insertedId);
};

const update = async (id, { name, categoryId, price, status, image, description }) => {
  const pool = await getPool();
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar(150), name)
    .input('categoryId', sql.Int, categoryId)
    .input('price', sql.Int, price)
    .input('status', sql.NVarChar(20), status)
    .input('image', sql.NVarChar(500), image ?? null)
    .input('description', sql.NVarChar(500), description ?? null)
    .query(`
      UPDATE dbo.Products
      SET Name = @name,
          CategoryId = @categoryId,
          Price = @price,
          Status = @status,
          Image = @image,
          Description = @description,
          UpdatedAt = GETDATE()
      WHERE Id = @id AND IsDeleted = 0
    `);

  return findById(id);
};

const softDelete = async (id) => {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.Int, id)
    .query(`
      UPDATE dbo.Products
      SET IsDeleted = 1,
          UpdatedAt = GETDATE()
      WHERE Id = @id AND IsDeleted = 0
    `);
  return result.rowsAffected[0] > 0;
};

module.exports = {
  findAll,
  findById,
  findByCode,
  generateNextCode,
  create,
  update,
  softDelete
};

