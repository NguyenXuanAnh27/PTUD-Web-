const request = require('supertest');
const app = require('../src/app');
const { sql, getPool, closePool } = require('../src/config/db');

describe('Tulo Coffee Backend API - Integration Tests', () => {
  const uniqueSuffix = Date.now();
  const testUser = {
    username: `testuser_${uniqueSuffix}`,
    email: `test_${uniqueSuffix}@tulocoffee.vn`,
    password: 'TestUser@123',
    fullName: 'Người Dùng Kiểm Thử',
    phone: '0901234567'
  };

  let adminToken = '';
  let customerToken = '';
  let customer2Token = '';
  let createdProductId = null;
  let createdOrderId = null;

  beforeAll(async () => {
    await getPool();
  });

  afterAll(async () => {
    // Dọn dẹp dữ liệu tạm sinh ra trong quá trình chạy test
    try {
      const pool = await getPool();
      if (createdOrderId) {
        await pool.request().input('orderId', sql.Int, createdOrderId).query('DELETE FROM dbo.Orders WHERE Id = @orderId');
      }
      if (createdProductId) {
        await pool.request().input('productId', sql.Int, createdProductId).query('DELETE FROM dbo.Products WHERE Id = @productId');
      }
      await pool
        .request()
        .input('username', sql.NVarChar(50), testUser.username)
        .query('DELETE FROM dbo.Users WHERE Username = @username');
    } finally {
      await closePool();
    }
  });

  describe('1. Health & 404 Handler', () => {
    test('GET /api/health trả về 200 OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('OK');
    });

    test('GET route không tồn tại trả về 404', async () => {
      const res = await request(app).get('/api/duong-dan-khong-ton-tai');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Auth (Đăng ký, Đăng nhập, Validate, Duplicate)', () => {
    test('POST /api/auth/register với dữ liệu sai trả về 400 kèm danh sách errors', async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'a',
        email: 'khong-phai-email',
        password: '123',
        fullName: ''
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
    });

    test('POST /api/auth/register tạo tài khoản thành công (201), không trả passwordHash', async () => {
      const res = await request(app).post('/api/auth/register').send({
        ...testUser,
        role: 'admin' // Cố tình truyền admin để kiểm tra server ép về customer
      });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(testUser.username);
      expect(res.body.data.role).toBe('customer');
      expect(res.body.data.passwordHash).toBeUndefined();
      expect(res.body.data.PasswordHash).toBeUndefined();
    });

    test('POST /api/auth/register trùng username trả về 409', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/auth/login sai mật khẩu trả về 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        usernameOrEmail: testUser.username,
        password: 'WrongPassword123'
      });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('POST /api/auth/login thành công cho Customer và Admin', async () => {
      const cusRes = await request(app).post('/api/auth/login').send({
        usernameOrEmail: testUser.username,
        password: testUser.password
      });
      expect(cusRes.statusCode).toBe(200);
      expect(cusRes.body.data.token).toBeTruthy();
      customerToken = cusRes.body.data.token;

      const admRes = await request(app).post('/api/auth/login').send({
        usernameOrEmail: 'admin',
        password: 'Admin@123'
      });
      expect(admRes.statusCode).toBe(200);
      expect(admRes.body.data.user.role).toBe('admin');
      adminToken = admRes.body.data.token;

      const cus2Res = await request(app).post('/api/auth/login').send({
        usernameOrEmail: 'khachhang2',
        password: 'User@123'
      });
      expect(cus2Res.statusCode).toBe(200);
      customer2Token = cus2Res.body.data.token;
    });
  });

  describe('3. Quản lý tài khoản & Phân quyền (401 / 403)', () => {
    test('GET /api/users/me không có token trả về 401', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.statusCode).toBe(401);
    });

    test('GET /api/users/me và PUT /api/users/me hoạt động đúng', async () => {
      const meRes = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(meRes.statusCode).toBe(200);
      expect(meRes.body.data.username).toBe(testUser.username);

      const updateRes = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ fullName: 'Tên Đã Cập Nhật', phone: '0988777666' });
      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.fullName).toBe('Tên Đã Cập Nhật');
    });

    test('Customer gọi route Admin (GET /api/users) bị chặn 403', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.statusCode).toBe(403);
    });

    test('Admin gọi GET /api/users trả về 200 kèm pagination', async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toHaveProperty('totalItems');
    });
  });

  describe('4. Sản phẩm (CRUD, Tìm kiếm, Lọc, Phân trang, Xóa mềm)', () => {
    test('GET /api/products phân trang ?page=1&limit=5', async () => {
      const res = await request(app).get('/api/products?page=1&limit=5');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(5);
      expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(16);
      expect(res.body.pagination.totalPages).toBeGreaterThanOrEqual(4);
    });

    test('GET /api/products tìm kiếm theo ?keyword= và lọc theo ?category=&status=', async () => {
      const searchRes = await request(app).get('/api/products?keyword=B%E1%BA%A1c%20X%E1%BB%89u');
      expect(searchRes.statusCode).toBe(200);
      expect(searchRes.body.data.some((p) => p.Code === 'CF002')).toBe(true);

      const filterRes = await request(app).get('/api/products?category=Tr%C3%A0&status=available');
      expect(filterRes.statusCode).toBe(200);
      expect(filterRes.body.data.every((p) => p.CategoryName === 'Trà' && p.Status === 'available')).toBe(true);

      const emptyRes = await request(app).get('/api/products?keyword=MonKhongTonTai9999');
      expect(emptyRes.statusCode).toBe(200);
      expect(emptyRes.body.data).toEqual([]);
    });

    test('Customer không được phép tạo sản phẩm (403)', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Món Lậu', categoryId: 1, price: 30000 });
      expect(res.statusCode).toBe(403);
    });

    test('Admin CRUD sản phẩm (POST -> GET -> PUT -> DELETE mềm)', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Cà Phê Test Tự Động',
          categoryId: 1,
          price: 38000,
          status: 'available',
          description: 'Sản phẩm test tự động'
        });
      expect(createRes.statusCode).toBe(201);
      createdProductId = createRes.body.data.Id;
      expect(createRes.body.data.Code).toMatch(/^CF\d{3}$/);

      const updateRes = await request(app)
        .put(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Cà Phê Test Đã Sửa',
          categoryId: 1,
          price: 40000,
          status: 'available'
        });
      expect(updateRes.statusCode).toBe(200);
      expect(updateRes.body.data.Price).toBe(40000);

      const deleteRes = await request(app)
        .delete(`/api/products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deleteRes.statusCode).toBe(200);

      const getAfterDelete = await request(app).get(`/api/products/${createdProductId}`);
      expect(getAfterDelete.statusCode).toBe(404);
    });
  });

  describe('5. Đơn hàng (Transaction & Ownership Check)', () => {
    test('Đặt hàng chứa món hết hàng (out_of_stock) bị rollback và trả về 400', async () => {
      const outRes = await request(app).get('/api/products?status=out_of_stock&limit=1');
      const outProduct = outRes.body.data[0];

      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          customerName: 'Khách Test',
          customerPhone: '0901234567',
          items: [{ productId: outProduct.Id, quantity: 1 }]
        });
      expect(res.statusCode).toBe(400);
    });

    test('Customer đặt đơn thành công (Transaction), kiểm tra ownership & hủy đơn pending', async () => {
      const listRes = await request(app).get('/api/products?status=available&limit=2');
      const [p1, p2] = listRes.body.data;

      const createRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          customerName: 'Khách Test',
          customerPhone: '0901234567',
          note: 'Ít đá',
          items: [
            { productId: p1.Id, quantity: 2 },
            { productId: p2.Id, quantity: 1 }
          ]
        });

      expect(createRes.statusCode).toBe(201);
      createdOrderId = createRes.body.data.Id;
      expect(createRes.body.data.TotalAmount).toBe(p1.Price * 2 + p2.Price);
      expect(createRes.body.data.items.length).toBe(2);

      // Customer khác cố tình xem đơn hàng này -> 403 Forbidden
      const hijackRes = await request(app)
        .get(`/api/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${customer2Token}`);
      expect(hijackRes.statusCode).toBe(403);

      // Chính chủ hủy đơn đang pending -> 200
      const cancelRes = await request(app)
        .patch(`/api/orders/${createdOrderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(cancelRes.statusCode).toBe(200);
      expect(cancelRes.body.data.Status).toBe('cancelled');
    });
  });

  describe('6. Thống kê & Đăng xuất', () => {
    test('Customer gọi thống kê bị chặn 403, Admin lấy đủ 5 API thống kê (200)', async () => {
      const forbid = await request(app)
        .get('/api/statistics/overview')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(forbid.statusCode).toBe(403);

      const [overview, revenue, byDay, top, catDist] = await Promise.all([
        request(app).get('/api/statistics/overview').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/statistics/revenue?year=2026').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/statistics/orders-by-day?month=11&year=2026').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/statistics/top-products?limit=5').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/statistics/category-distribution').set('Authorization', `Bearer ${adminToken}`)
      ]);

      expect(overview.statusCode).toBe(200);
      expect(overview.body.data.TotalProducts).toBeGreaterThanOrEqual(16);
      expect(revenue.statusCode).toBe(200);
      expect(revenue.body.data.months.length).toBe(12);
      expect(byDay.statusCode).toBe(200);
      expect(top.statusCode).toBe(200);
      expect(catDist.statusCode).toBe(200);
    });

    test('POST /api/auth/logout vô hiệu hóa token hiện tại', async () => {
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(logoutRes.statusCode).toBe(200);

      const reuseRes = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(reuseRes.statusCode).toBe(401);
    });
  });
});

