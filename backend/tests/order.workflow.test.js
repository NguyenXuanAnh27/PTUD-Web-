/**
 * Unit test quy trình duyệt đơn (KHÔNG cần SQL Server: repository được giả lập bằng jest.mock).
 * Chạy riêng: npx jest tests/order.workflow.test.js
 */
// Khai báo bản giả thủ công (không automock) để Jest không phải nạp thư viện SQL Server thật
jest.mock('../src/repositories/order.repository', () => ({
  createOrderWithDetails: jest.fn(),
  findAll: jest.fn(),
  findByIdWithDetails: jest.fn(),
  updateStatus: jest.fn(),
  getStatusSummary: jest.fn()
}));
jest.mock('../src/repositories/user.repository', () => ({
  findById: jest.fn()
}));

const orderRepository = require('../src/repositories/order.repository');
const orderService = require('../src/services/order.service');

const admin = { id: 1, role: 'admin' };
const customer = { id: 7, role: 'customer' };

const makeOrder = (status, extra = {}) => ({
  Id: 10,
  UserId: 7,
  OrderCode: 'ORD-TEST',
  Status: status,
  CreatedAt: new Date('2026-11-14T08:00:00Z'),
  UpdatedAt: new Date('2026-11-14T08:05:00Z'),
  items: [],
  history: [{ Status: 'pending', CreatedAt: new Date('2026-11-14T08:00:00Z') }],
  ...extra
});

beforeEach(() => {
  jest.resetAllMocks();
  orderRepository.updateStatus.mockImplementation(async (id, data) => makeOrder(data.status));
});

describe('Quy trình duyệt đơn - admin', () => {
  test.each([
    ['pending', 'confirmed'],
    ['confirmed', 'preparing'],
    ['preparing', 'ready'],
    ['ready', 'completed']
  ])('cho phép %s -> %s', async (from, to) => {
    orderRepository.findByIdWithDetails.mockResolvedValue(makeOrder(from));
    const result = await orderService.updateOrderStatus(10, to, admin);
    expect(result.Status).toBe(to);
    expect(orderRepository.updateStatus).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ expectedStatus: from, status: to, role: 'admin', userId: 1 })
    );
  });

  test.each([
    ['pending', 'preparing'],
    ['pending', 'completed'],
    ['confirmed', 'pending'],
    ['preparing', 'confirmed'],
    ['ready', 'preparing']
  ])('chặn nhảy bước/lùi bước %s -> %s', async (from, to) => {
    orderRepository.findByIdWithDetails.mockResolvedValue(makeOrder(from));
    await expect(orderService.updateOrderStatus(10, to, admin)).rejects.toMatchObject({ statusCode: 400 });
    expect(orderRepository.updateStatus).not.toHaveBeenCalled();
  });

  test.each(['completed', 'cancelled'])('trạng thái cuối %s không đổi được nữa', async (final) => {
    orderRepository.findByIdWithDetails.mockResolvedValue(makeOrder(final));
    await expect(orderService.updateOrderStatus(10, 'confirmed', admin)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('từ chối đơn bắt buộc có lý do', async () => {
    orderRepository.findByIdWithDetails.mockResolvedValue(makeOrder('pending'));
    await expect(orderService.updateOrderStatus(10, 'cancelled', admin)).rejects.toMatchObject({ statusCode: 400 });
    await expect(orderService.updateOrderStatus(10, 'cancelled', admin, '  ab ')).rejects.toMatchObject({
      statusCode: 400
    });
    expect(orderRepository.updateStatus).not.toHaveBeenCalled();
  });

  test.each(['pending', 'confirmed', 'preparing', 'ready'])('hủy từ %s kèm lý do thì được', async (from) => {
    orderRepository.findByIdWithDetails.mockResolvedValue(makeOrder(from));
    await orderService.updateOrderStatus(10, 'cancelled', admin, ' Hết nguyên liệu ');
    expect(orderRepository.updateStatus).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ status: 'cancelled', reason: 'Hết nguyên liệu', expectedStatus: from })
    );
  });

  test('đặt lại đúng trạng thái hiện tại bị từ chối', async () => {
    orderRepository.findByIdWithDetails.mockResolvedValue(makeOrder('confirmed'));
    await expect(orderService.updateOrderStatus(10, 'confirmed', admin)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('đơn không tồn tại -> 404', async () => {
    orderRepository.findByIdWithDetails.mockResolvedValue(null);
    await expect(orderService.updateOrderStatus(10, 'confirmed', admin)).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('Khách hàng hủy đơn / xem đơn', () => {
  test('khách hủy được đơn pending của mình, ghi nhận vai trò customer', async () => {
    orderRepository.findByIdWithDetails.mockResolvedValue(makeOrder('pending'));
    await orderService.cancelMyOrder(10, customer);
    expect(orderRepository.updateStatus).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ status: 'cancelled', role: 'customer', reason: 'Khách hàng hủy đơn' })
    );
  });

  test('khách KHÔNG hủy được khi quán đã duyệt', async () => {
    orderRepository.findByIdWithDetails.mockResolvedValue(makeOrder('confirmed'));
    await expect(orderService.cancelMyOrder(10, customer)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('khách KHÔNG hủy được đơn của người khác', async () => {
    orderRepository.findByIdWithDetails.mockResolvedValue(makeOrder('pending', { UserId: 99 }));
    await expect(orderService.cancelMyOrder(10, customer)).rejects.toMatchObject({ statusCode: 403 });
  });

  test('khách KHÔNG xem được đơn của người khác, admin thì được', async () => {
    orderRepository.findByIdWithDetails.mockResolvedValue(makeOrder('pending', { UserId: 99 }));
    await expect(orderService.getOrderById(10, customer)).rejects.toMatchObject({ statusCode: 403 });
    await expect(orderService.getOrderById(10, admin)).resolves.toMatchObject({ Id: 10 });
  });

  test('đơn cũ chưa có lịch sử vẫn có timeline dựng tạm', async () => {
    orderRepository.findByIdWithDetails.mockResolvedValue(makeOrder('completed', { history: [] }));
    const order = await orderService.getOrderById(10, customer);
    expect(order.history.map((h) => h.Status)).toEqual(['pending', 'completed']);
  });
});

describe('Tổng hợp cho admin', () => {
  test('đếm theo trạng thái, tổng đơn đang xử lý và ID đơn chờ duyệt mới nhất', async () => {
    orderRepository.getStatusSummary.mockResolvedValue([
      { Status: 'pending', Total: 3, LatestId: 42 },
      { Status: 'preparing', Total: 2, LatestId: 40 },
      { Status: 'completed', Total: 10, LatestId: 30 }
    ]);
    const summary = await orderService.getOrderSummary();
    expect(summary.counts).toEqual({
      pending: 3,
      confirmed: 0,
      preparing: 2,
      ready: 0,
      completed: 10,
      cancelled: 0
    });
    expect(summary).toMatchObject({ total: 15, active: 5, latestPendingOrderId: 42 });
  });

  test('chưa có đơn nào -> toàn số 0', async () => {
    orderRepository.getStatusSummary.mockResolvedValue([]);
    const summary = await orderService.getOrderSummary();
    expect(summary).toMatchObject({ total: 0, active: 0, latestPendingOrderId: 0 });
  });
});
