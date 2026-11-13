/**
 * ==========================================================================
 * TULO COFFEE - TẦNG KẾT NỐI API BACKEND (FRONTEND API CLIENT)
 * Kết nối Frontend HTML/CSS/JS với Node.js + Express + SQL Server (port 5000)
 * ==========================================================================
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Mã hóa ký tự đặc biệt HTML để chèn dữ liệu người dùng vào innerHTML an toàn (chống XSS).
 * Mọi dữ liệu từ server/người dùng (tên, ghi chú, tên món...) phải đi qua hàm này.
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const AUTH_STORAGE = {
  TOKEN: 'tulo_auth_token',
  USER: 'tulo_auth_user'
};

/**
 * Lấy JWT token & user đang đăng nhập từ LocalStorage
 */
function getAuthToken() {
  return localStorage.getItem(AUTH_STORAGE.TOKEN) || '';
}

function getAuthUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE.USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setAuthSession(token, user) {
  localStorage.setItem(AUTH_STORAGE.TOKEN, token);
  localStorage.setItem(AUTH_STORAGE.USER, JSON.stringify(user));
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE.TOKEN);
  localStorage.removeItem(AUTH_STORAGE.USER);
}

/**
 * Hàm gọi API dùng chung (tự động gắn Bearer JWT & xử lý lỗi JSON chuẩn)
 */
async function apiRequest(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
  } catch {
    throw new Error('Không thể kết nối tới Backend Server (http://localhost:5000). Hãy chắc chắn đã chạy npm run dev trong thư mục backend!');
  }

  const payload = await response.json().catch(() => ({
    success: false,
    message: 'Phản hồi từ server không hợp lệ'
  }));

  if (!response.ok || payload.success === false) {
    if (response.status === 401 && token) {
      clearAuthSession();
      if (typeof renderNavbarAuth === 'function') renderNavbarAuth();
    }
    const err = new Error(payload.message || `Lỗi HTTP ${response.status}`);
    err.status = response.status;
    err.errors = payload.errors || [];
    throw err;
  }

  return payload;
}

/**
 * Chuẩn hóa đối tượng Product từ SQL Server (PascalCase) sang format Frontend
 */
function mapApiProduct(p) {
  return {
    dbId: p.Id,
    id: p.Code,
    code: p.Code,
    name: p.Name,
    categoryId: p.CategoryId,
    category: p.CategoryName || '',
    categoryCode: p.CategoryCode || '',
    price: Number(p.Price),
    status: p.Status,
    image: p.Image || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600',
    description: p.Description || '',
    createdAt: p.CreatedAt
  };
}

/* ==========================================================================
   AUTH UI: NÚT ĐĂNG NHẬP / TÀI KHOẢN + MODAL ĐĂNG NHẬP / ĐĂNG KÝ + ĐƠN HÀNG CỦA TÔI
   ========================================================================== */

function ensureAuthUI() {
  // 1. Tạo Modal Đăng nhập / Đăng ký nếu chưa có
  if (!document.getElementById('authModal')) {
    const authModalHtml = `
      <div id="authModal" class="modal-overlay" role="dialog" aria-modal="true">
        <div class="modal-container" style="max-width: 440px;">
          <div class="modal-header">
            <h3 id="authModalTitle" class="modal-title">Đăng Nhập Tulo Coffee</h3>
            <button type="button" id="closeAuthModalBtn" class="btn-icon" aria-label="Đóng">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display:flex; gap:8px; margin-bottom:18px;">
              <button type="button" id="tabLoginBtn" class="pill-btn active" style="flex:1; justify-content:center;">Đăng Nhập</button>
              <button type="button" id="tabRegisterBtn" class="pill-btn" style="flex:1; justify-content:center;">Đăng Ký</button>
            </div>

            <!-- Form Đăng nhập -->
            <form id="loginForm" novalidate>
              <div class="form-group">
                <label for="loginUsername" class="form-label">Tên đăng nhập hoặc Email *</label>
                <input type="text" id="loginUsername" class="form-input" placeholder="admin hoặc khachhang1">
              </div>
              <div class="form-group">
                <label for="loginPassword" class="form-label">Mật khẩu *</label>
                <input type="password" id="loginPassword" class="form-input" placeholder="Nhập mật khẩu...">
              </div>
              <div style="font-size:0.8rem; color:var(--text-muted); background:var(--bg-surface-alt); padding:10px 12px; border-radius:8px; margin-bottom:16px;">
                <strong>Tài khoản demo:</strong><br/>
                • Admin: <code>admin</code> / <code>Admin@123</code><br/>
                • Khách: <code>khachhang1</code> / <code>User@123</code>
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%;">Đăng Nhập</button>
            </form>

            <!-- Form Đăng ký -->
            <form id="registerForm" style="display:none;" novalidate>
              <div class="form-group">
                <label for="regUsername" class="form-label">Tên đăng nhập *</label>
                <input type="text" id="regUsername" class="form-input" placeholder="VD: nguyenvana">
              </div>
              <div class="form-group">
                <label for="regEmail" class="form-label">Email *</label>
                <input type="email" id="regEmail" class="form-input" placeholder="email@example.com">
              </div>
              <div class="form-group">
                <label for="regFullName" class="form-label">Họ và tên *</label>
                <input type="text" id="regFullName" class="form-input" placeholder="Nguyễn Văn A">
              </div>
              <div class="form-group">
                <label for="regPhone" class="form-label">Số điện thoại</label>
                <input type="tel" id="regPhone" class="form-input" placeholder="0901234567">
              </div>
              <div class="form-group">
                <label for="regPassword" class="form-label">Mật khẩu (≥ 6 ký tự) *</label>
                <input type="password" id="regPassword" class="form-input" placeholder="Nhập mật khẩu...">
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%;">Tạo Tài Khoản</button>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', authModalHtml);

    // Gắn sự kiện Modal Auth
    const authModal = document.getElementById('authModal');
    const closeBtn = document.getElementById('closeAuthModalBtn');
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabRegister = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const title = document.getElementById('authModalTitle');

    closeBtn.addEventListener('click', () => closeAuthModal());
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModal();
    });

    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      title.textContent = 'Đăng Nhập Tulo Coffee';
    });

    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      registerForm.style.display = 'block';
      loginForm.style.display = 'none';
      title.textContent = 'Đăng Ký Tài Khoản';
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameOrEmail = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!usernameOrEmail || !password) {
        showToast('Vui lòng nhập đầy đủ tài khoản và mật khẩu!', 'error');
        return;
      }

      try {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ usernameOrEmail, password })
        });
        setAuthSession(res.data.token, res.data.user);
        closeAuthModal();
        renderNavbarAuth();
        showToast(`Xin chào ${res.data.user.fullName}!`, 'success');
        if (typeof window.onAuthChanged === 'function') window.onAuthChanged(res.data.user);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        username: document.getElementById('regUsername').value.trim(),
        email: document.getElementById('regEmail').value.trim(),
        fullName: document.getElementById('regFullName').value.trim(),
        phone: document.getElementById('regPhone').value.trim(),
        password: document.getElementById('regPassword').value
      };

      try {
        await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        showToast('Đăng ký thành công! Hãy đăng nhập ngay.', 'success');
        tabLogin.click();
        document.getElementById('loginUsername').value = body.username;
      } catch (err) {
        const firstErr = err.errors && err.errors[0] ? err.errors[0].message : err.message;
        showToast(firstErr, 'error');
      }
    });
  }

  // 2. Tạo Modal Tài khoản (Đơn hàng của tôi + Hồ sơ cá nhân + Đổi mật khẩu)
  if (!document.getElementById('myOrdersModal')) {
    const ordersModalHtml = `
      <div id="myOrdersModal" class="modal-overlay" role="dialog" aria-modal="true">
        <div class="modal-container" style="max-width: 720px;">
          <div class="modal-header">
            <h3 id="accountModalTitle" class="modal-title">Tài Khoản & Đơn Hàng</h3>
            <button type="button" id="closeMyOrdersBtn" class="btn-icon" aria-label="Đóng">&times;</button>
          </div>
          <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
            <div style="display:flex; gap:8px; margin-bottom:18px; flex-wrap:wrap;">
              <button type="button" id="accTabOrders" class="pill-btn active">Đơn hàng của tôi</button>
              <button type="button" id="accTabProfile" class="pill-btn">Hồ sơ cá nhân</button>
              <button type="button" id="accTabPassword" class="pill-btn">Đổi mật khẩu</button>
            </div>

            <div id="myOrdersContent">
              <p>Đang tải đơn hàng...</p>
            </div>

            <form id="myProfileForm" style="display:none;" novalidate>
              <div class="form-group">
                <label class="form-label">Tên đăng nhập</label>
                <input type="text" id="profUsername" class="form-input" readonly style="background:var(--border-color); cursor:not-allowed;">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="profEmail" class="form-input" readonly style="background:var(--border-color); cursor:not-allowed;">
              </div>
              <div class="form-group">
                <label for="profFullName" class="form-label">Họ và tên *</label>
                <input type="text" id="profFullName" class="form-input" placeholder="Nhập họ và tên...">
              </div>
              <div class="form-group">
                <label for="profPhone" class="form-label">Số điện thoại</label>
                <input type="tel" id="profPhone" class="form-input" placeholder="0901234567">
              </div>
              <button type="submit" class="btn btn-primary">Lưu Hồ Sơ</button>
            </form>

            <form id="myPasswordForm" style="display:none;" novalidate>
              <div class="form-group">
                <label for="curPassword" class="form-label">Mật khẩu hiện tại *</label>
                <input type="password" id="curPassword" class="form-input" placeholder="Nhập mật khẩu đang dùng...">
              </div>
              <div class="form-group">
                <label for="newPassword" class="form-label">Mật khẩu mới (≥ 6 ký tự) *</label>
                <input type="password" id="newPassword" class="form-input" placeholder="Nhập mật khẩu mới...">
              </div>
              <div class="form-group">
                <label for="confirmNewPassword" class="form-label">Xác nhận mật khẩu mới *</label>
                <input type="password" id="confirmNewPassword" class="form-input" placeholder="Nhập lại mật khẩu mới...">
              </div>
              <button type="submit" class="btn btn-primary">Cập Nhật Mật Khẩu</button>
            </form>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', ordersModalHtml);
    const modal = document.getElementById('myOrdersModal');
    const tabOrders = document.getElementById('accTabOrders');
    const tabProfile = document.getElementById('accTabProfile');
    const tabPassword = document.getElementById('accTabPassword');
    const ordersContent = document.getElementById('myOrdersContent');
    const profileForm = document.getElementById('myProfileForm');
    const passwordForm = document.getElementById('myPasswordForm');

    const switchAccountTab = (tabName) => {
      [tabOrders, tabProfile, tabPassword].forEach(b => b.classList.remove('active'));
      ordersContent.style.display = 'none';
      profileForm.style.display = 'none';
      passwordForm.style.display = 'none';

      if (tabName === 'orders') {
        tabOrders.classList.add('active');
        ordersContent.style.display = 'block';
        loadMyOrdersTab();
      } else if (tabName === 'profile') {
        tabProfile.classList.add('active');
        profileForm.style.display = 'block';
        loadMyProfileTab();
      } else {
        tabPassword.classList.add('active');
        passwordForm.style.display = 'block';
        passwordForm.reset();
      }
    };

    tabOrders.addEventListener('click', () => switchAccountTab('orders'));
    tabProfile.addEventListener('click', () => switchAccountTab('profile'));
    tabPassword.addEventListener('click', () => switchAccountTab('password'));

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('profFullName').value.trim();
      const phone = document.getElementById('profPhone').value.trim();
      try {
        const res = await apiRequest('/users/me', {
          method: 'PUT',
          body: JSON.stringify({ fullName, phone })
        });
        setAuthSession(getAuthToken(), res.data);
        renderNavbarAuth();
        showToast('Cập nhật hồ sơ cá nhân thành công!', 'success');
      } catch (err) {
        const detail = err.errors && err.errors[0] ? err.errors[0].message : err.message;
        showToast(detail, 'error');
      }
    });

    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('curPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmNew = document.getElementById('confirmNewPassword').value;

      if (newPassword !== confirmNew) {
        showToast('Xác nhận mật khẩu mới không khớp!', 'error');
        return;
      }

      try {
        await apiRequest('/users/me/password', {
          method: 'PUT',
          body: JSON.stringify({ currentPassword, newPassword })
        });
        passwordForm.reset();
        showToast('Đổi mật khẩu thành công!', 'success');
      } catch (err) {
        const detail = err.errors && err.errors[0] ? err.errors[0].message : err.message;
        showToast(detail, 'error');
      }
    });

    document.getElementById('closeMyOrdersBtn').addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  renderNavbarAuth();
}

function openAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function renderNavbarAuth() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  const oldWidget = document.getElementById('navAuthWidget');
  if (oldWidget) oldWidget.remove();

  const user = getAuthUser();
  const wrapper = document.createElement('div');
  wrapper.id = 'navAuthWidget';
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.gap = '8px';

  if (!user) {
    wrapper.innerHTML = `
      <button type="button" id="openLoginBtn" class="btn btn-secondary btn-sm">
        Đăng nhập
      </button>
    `;
  } else {
    const roleTag = user.role === 'admin' ? 'Admin' : 'Khách';
    wrapper.innerHTML = `
      <button type="button" id="myOrdersBtn" class="btn btn-secondary btn-sm" title="Xem đơn hàng của bạn">
        👤 ${escapeHtml(user.fullName.split(' ').slice(-1)[0])} (${roleTag})
      </button>
      <button type="button" id="logoutBtn" class="btn btn-outline btn-sm" title="Đăng xuất">
        Thoát
      </button>
    `;
  }

  // Chèn trước nút mobile-toggle
  const mobileBtn = navActions.querySelector('.mobile-toggle');
  if (mobileBtn) {
    navActions.insertBefore(wrapper, mobileBtn);
  } else {
    navActions.appendChild(wrapper);
  }

  const openLoginBtn = document.getElementById('openLoginBtn');
  if (openLoginBtn) openLoginBtn.addEventListener('click', openAuthModal);

  const myOrdersBtn = document.getElementById('myOrdersBtn');
  if (myOrdersBtn) myOrdersBtn.addEventListener('click', openMyOrdersModal);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await apiRequest('/auth/logout', { method: 'POST' });
      } catch {
        // Bỏ qua nếu token đã hết hạn
      }
      clearAuthSession();
      renderNavbarAuth();
      showToast('Đã đăng xuất tài khoản!', 'info');
      if (typeof window.onAuthChanged === 'function') window.onAuthChanged(null);
    });
  }
}

async function openMyOrdersModal() {
  const modal = document.getElementById('myOrdersModal');
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  const tabOrders = document.getElementById('accTabOrders');
  if (tabOrders) tabOrders.click();
}

async function loadMyProfileTab() {
  try {
    const res = await apiRequest('/users/me');
    const u = res.data;
    document.getElementById('profUsername').value = u.username || '';
    document.getElementById('profEmail').value = u.email || '';
    document.getElementById('profFullName').value = u.fullName || '';
    document.getElementById('profPhone').value = u.phone || '';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadMyOrdersTab() {
  const content = document.getElementById('myOrdersContent');
  if (!content) return;
  content.innerHTML = '<p style="text-align:center; padding:20px;">Đang tải lịch sử đơn hàng...</p>';

  try {
    const res = await apiRequest('/orders/my-orders?limit=20');
    const orders = res.data || [];

    if (orders.length === 0) {
      content.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:20px;">Bạn chưa đặt đơn hàng nào.</p>';
      return;
    }

    const statusLabels = {
      pending: { text: 'Chờ xác nhận', cls: 'badge-out' },
      confirmed: { text: 'Đang pha chế', cls: 'badge-available' },
      completed: { text: 'Hoàn thành', cls: 'badge-available' },
      cancelled: { text: 'Đã hủy', cls: 'badge-out' }
    };

    content.innerHTML = orders.map((o) => {
      const st = statusLabels[o.Status] || { text: o.Status, cls: '' };
      const dateStr = new Date(o.CreatedAt).toLocaleString('vi-VN');
      return `
        <div style="border:1px solid var(--border-color); border-radius:10px; padding:14px; margin-bottom:12px;">
          <div class="flex-between" style="margin-bottom:8px;">
            <strong>${escapeHtml(o.OrderCode)}</strong>
            <span class="product-badge ${st.cls}" style="position:static;">${st.text}</span>
          </div>
          <div style="font-size:0.86rem; color:var(--text-muted); margin-bottom:8px;">
            Thời gian: ${dateStr} • Số món: ${o.ItemCount}
          </div>
          <div class="flex-between">
            <strong style="color:var(--primary);">Tổng: ${formatCurrency(o.TotalAmount)}</strong>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-sm" onclick="viewOrderDetails(${o.Id})">Chi tiết</button>
              ${o.Status === 'pending' ? `<button class="btn btn-danger btn-sm" onclick="cancelCustomerOrder(${o.Id})">Hủy đơn</button>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    content.innerHTML = `<p style="color:#D32F2F;">${escapeHtml(err.message)}</p>`;
  }
}

window.cancelCustomerOrder = async function (orderId) {
  if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
  try {
    await apiRequest(`/orders/${orderId}/cancel`, { method: 'PATCH' });
    showToast('Đã hủy đơn hàng thành công!', 'info');
    loadMyOrdersTab();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

/**
 * Xem chi tiết đơn hàng (GET /api/orders/:id - kiểm tra Ownership trên Backend)
 */
window.viewOrderDetails = async function (orderId) {
  let detailModal = document.getElementById('orderDetailModal');
  if (!detailModal) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="orderDetailModal" class="modal-overlay" role="dialog" aria-modal="true" style="z-index: 1200;">
        <div class="modal-container" style="max-width: 560px;">
          <div class="modal-header">
            <h3 id="orderDetailTitle" class="modal-title">Chi Tiết Đơn Hàng</h3>
            <button type="button" id="closeOrderDetailBtn" class="btn-icon" aria-label="Đóng">&times;</button>
          </div>
          <div class="modal-body" id="orderDetailBody"></div>
        </div>
      </div>
    `);
    detailModal = document.getElementById('orderDetailModal');
    document.getElementById('closeOrderDetailBtn').addEventListener('click', () => {
      detailModal.classList.remove('active');
    });
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) detailModal.classList.remove('active');
    });
  }

  const bodyEl = document.getElementById('orderDetailBody');
  const titleEl = document.getElementById('orderDetailTitle');
  detailModal.classList.add('active');
  bodyEl.innerHTML = '<p style="text-align:center; padding:16px;">Đang tải chi tiết...</p>';

  try {
    const res = await apiRequest(`/orders/${orderId}`);
    const o = res.data;
    titleEl.textContent = `Đơn Hàng ${o.OrderCode}`;
    bodyEl.innerHTML = `
      <div style="font-size:0.9rem; margin-bottom:14px; line-height:1.6;">
        <div><strong>Khách hàng:</strong> ${escapeHtml(o.CustomerName)} (${escapeHtml(o.CustomerPhone)})</div>
        <div><strong>Trạng thái:</strong> ${o.Status}</div>
        <div><strong>Ghi chú:</strong> ${escapeHtml(o.Note || 'Không có')}</div>
      </div>
      <table class="data-table" style="font-size:0.88rem;">
        <thead>
          <tr><th>Món</th><th>SL</th><th>Đơn Giá</th><th>Thành Tiền</th></tr>
        </thead>
        <tbody>
          ${(o.items || []).map(item => `
            <tr>
              <td>${escapeHtml(item.ProductName)}</td>
              <td>${item.Quantity}</td>
              <td>${formatCurrency(item.UnitPrice)}</td>
              <td><strong>${formatCurrency(item.Subtotal)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div style="text-align:right; margin-top:14px; font-size:1.05rem; color:var(--primary);">
        <strong>Tổng cộng: ${formatCurrency(o.TotalAmount)}</strong>
      </div>
    `;
  } catch (err) {
    bodyEl.innerHTML = `<p style="color:#D32F2F;">${escapeHtml(err.message)}</p>`;
  }
};

