/**
 * ==========================================================================
 * TULO COFFEE - LOGIC ỨNG DỤNG (APPLICATION CONTROLLER)
 * Kết nối trực tiếp Backend RESTful API (Node.js + Express + SQL Server)
 * Bao gồm:
 * 1. Các tiện ích dùng chung: Dark Mode, Toast, Navigation, Auth, Giỏ hàng (API Orders)
 * 2. Trang chủ (index.html): Menu nổi bật từ API, Form liên hệ
 * 3. Trang thực đơn (menu.html): Tìm kiếm, Lọc danh mục, Sắp xếp qua API
 * 4. Trang quản lý (quanly.html): Thống kê Dashboard, CRUD sản phẩm, Quản lý đơn hàng,
 *    Phân trang server-side, Xuất JSON
 * ==========================================================================
 */

// Bộ nhớ đệm danh sách món vừa tải từ API để dùng cho Giỏ hàng & Modal sửa
window.__menuCache = [];

// Chờ DOM sẵn sàng trước khi khởi chạy
document.addEventListener('DOMContentLoaded', () => {
  initCommonFeatures();

  // Xác định trang hiện tại để chạy controller phù hợp
  const path = window.location.pathname.toLowerCase();
  if (path.includes('quanly.html')) {
    initAdminPage();
  } else if (path.includes('menu.html')) {
    initMenuPage();
  } else {
    initHomePage();
  }
});

/* ==========================================================================
   1. CHỨC NĂNG DÙNG CHUNG TRÊN MỌI TRANG (COMMON FEATURES)
   ========================================================================== */

function initCommonFeatures() {
  initTheme();
  initMobileNav();
  if (typeof ensureAuthUI === 'function') {
    ensureAuthUI();
  }
  initCartDrawer();
  updateCartBadge();
}

/**
 * Quản lý chế độ Sáng / Tối (Dark / Light Theme)
 */
function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      updateThemeIcon(newTheme);
      showToast(`Đã chuyển sang chế độ ${newTheme === 'dark' ? 'Tối' : 'Sáng'}`, 'info');
    });
  });
}

function updateThemeIcon(theme) {
  const icons = document.querySelectorAll('.theme-icon');
  const sunSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  const moonSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  icons.forEach(icon => {
    icon.innerHTML = theme === 'dark' ? sunSvg : moonSvg;
  });
}

/**
 * Menu responsive trên thiết bị di động
 */
function initMobileNav() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('show');
    });

    // Đóng menu khi nhấp vào một link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('show');
      });
    });
  }
}

/**
 * Hiển thị thông báo Toast nổi (Tự biến mất sau 3.2s)
 * @param {string} message Nội dung thông báo
 * @param {'success'|'error'|'info'} type Loại thông báo
 */
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const iconMap = {
    success: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#2E7D32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    error: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#D32F2F" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    info: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <span style="display:inline-flex;align-items:center;">${iconMap[type] || ''}</span>
      <span>${escapeHtml(message)}</span>
    </div>
    <button type="button" style="color:var(--text-muted);font-weight:bold;cursor:pointer;">&times;</button>
  `;

  // Nút đóng thủ công
  toast.querySelector('button').addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  });

  container.appendChild(toast);

  // Kích hoạt animation hiện
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Tự ẩn sau 3.2s
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }
  }, 3200);
}

/**
 * Quản lý Giỏ hàng & Đặt đơn hàng thật qua API POST /api/orders
 */
function initCartDrawer() {
  const cartBtns = document.querySelectorAll('.cart-trigger-btn');
  const overlay = document.getElementById('cartDrawerOverlay');
  const drawer = document.getElementById('cartDrawer');
  const closeBtn = document.getElementById('closeCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (!drawer) return;

  function openCart() {
    renderCartItems();
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  cartBtns.forEach(b => b.addEventListener('click', openCart));
  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  if (overlay) overlay.addEventListener('click', closeCart);

  // Thanh toán / Gửi đơn hàng lên Backend SQL Server
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      const cart = getCartData();
      if (cart.length === 0) {
        showToast('Giỏ hàng đang trống!', 'error');
        return;
      }

      const currentUser = getAuthUser();
      if (!currentUser || !getAuthToken()) {
        showToast('Vui lòng đăng nhập để xác nhận đặt món!', 'info');
        closeCart();
        openAuthModal();
        return;
      }

      // Kiểm tra các món trong giỏ có dbId hợp lệ từ API chưa
      const validItems = cart.filter(item => Number.isInteger(item.dbId) && item.dbId > 0);
      if (validItems.length !== cart.length) {
        showToast('Giỏ hàng chứa dữ liệu cũ, vui lòng chọn lại món từ thực đơn!', 'error');
        saveCartData([]);
        updateCartBadge();
        renderCartItems();
        return;
      }

      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const confirmOrder = confirm(`Xác nhận đặt ${cart.length} món với tổng thanh toán ${formatCurrency(totalAmount)}?`);
      if (!confirmOrder) return;

      try {
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Đang gửi đơn...';

        const res = await apiRequest('/orders', {
          method: 'POST',
          body: JSON.stringify({
            customerName: currentUser.fullName,
            customerPhone: currentUser.phone || '0909123456',
            items: validItems.map(i => ({ productId: i.dbId, quantity: i.quantity }))
          })
        });

        saveCartData([]);
        updateCartBadge();
        renderCartItems();
        closeCart();
        showToast(`Đặt món thành công! Mã đơn: ${res.data.OrderCode}`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Xác Nhận Đặt Món';
      }
    });
  }
}

/**
 * Cập nhật số lượng hiển thị trên Badge giỏ hàng
 */
function updateCartBadge() {
  const cart = getCartData();
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badges = document.querySelectorAll('.cart-badge');
  badges.forEach(badge => {
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
  });
}

/**
 * Thêm sản phẩm vào giỏ hàng
 * @param {string} productCode Mã sản phẩm (CF001, TR001...)
 */
function addToCart(productCode) {
  const product = window.__menuCache.find(p => p.id === productCode);

  if (!product) {
    showToast('Không tìm thấy sản phẩm!', 'error');
    return;
  }

  if (product.status === 'out_of_stock') {
    showToast('Món này hiện đang tạm hết hàng!', 'error');
    return;
  }

  const cart = getCartData();
  const existing = cart.find(item => item.id === productCode);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      dbId: product.dbId,
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  saveCartData(cart);
  updateCartBadge();
  renderCartItems();
  showToast(`Đã thêm "${product.name}" vào giỏ hàng!`, 'success');
}

/**
 * Vẽ danh sách sản phẩm trong drawer giỏ hàng
 */
function renderCartItems() {
  const container = document.getElementById('cartItemsList');
  const totalEl = document.getElementById('cartTotalPrice');
  if (!container || !totalEl) return;

  const cart = getCartData();

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px 10px;">
        <div class="empty-icon" style="color: var(--secondary);">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
        <p class="empty-title" style="font-size: 1.15rem;">Giỏ hàng của bạn đang trống</p>
        <p style="font-size: 0.88rem; color: var(--text-muted);">Hãy chọn những món thức uống rang mộc từ thực đơn nhé!</p>
      </div>
    `;
    totalEl.textContent = formatCurrency(0);
    return;
  }

  let total = 0;
  container.innerHTML = cart.map(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    return `
      <div class="cart-item">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100'"/>
        <div class="cart-item-info">
          <div class="cart-item-title">${escapeHtml(item.name)}</div>
          <div class="cart-item-price">${formatCurrency(item.price)}</div>
          <div class="cart-qty-controls">
            <button class="qty-btn" onclick="updateItemQuantity('${item.id}', -1)">-</button>
            <span style="font-weight: 600; font-size: 0.9rem; min-width: 20px; text-align: center;">${item.quantity}</span>
            <button class="qty-btn" onclick="updateItemQuantity('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="btn-icon" style="border:none; color:#D32F2F;" onclick="removeItemFromCart('${item.id}')" title="Xóa món">🗑️</button>
      </div>
    `;
  }).join('');

  totalEl.textContent = formatCurrency(total);
}

// Thay đổi số lượng món trong giỏ
window.updateItemQuantity = function (id, delta) {
  let cart = getCartData();
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  saveCartData(cart);
  updateCartBadge();
  renderCartItems();
};

// Xóa hẳn món khỏi giỏ
window.removeItemFromCart = function (id) {
  let cart = getCartData();
  cart = cart.filter(i => i.id !== id);
  saveCartData(cart);
  updateCartBadge();
  renderCartItems();
  showToast('Đã xóa món khỏi giỏ hàng', 'info');
};


/* ==========================================================================
   2. LOGIC TRANG CHỦ (INDEX.HTML)
   ========================================================================== */

function initHomePage() {
  renderFeaturedMenu();
  initContactForm();
}

/**
 * Hiển thị 4 món tiêu biểu trên trang chủ từ Backend API
 */
async function renderFeaturedMenu() {
  const container = document.getElementById('featuredMenuGrid');
  if (!container) return;

  container.innerHTML = `<p class="text-center" style="grid-column: 1/-1; color: var(--text-muted);">Đang tải thực đơn từ máy chủ...</p>`;

  try {
    const res = await apiRequest('/products?status=available&limit=4&sort=name-asc');
    const featured = (res.data || []).map(mapApiProduct);
    window.__menuCache = featured;

    if (featured.length === 0) {
      container.innerHTML = `<p class="text-center" style="grid-column: 1/-1;">Đang cập nhật thực đơn nổi bật...</p>`;
      return;
    }

    container.innerHTML = featured.map(item => createProductCardHtml(item)).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-center" style="grid-column: 1/-1; color: #D32F2F;">${escapeHtml(err.message)}</p>`;
  }
}

/**
 * Xử lý kiểm tra dữ liệu và gửi form liên hệ
 */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('#contactName').value.trim();
    const phone = form.querySelector('#contactPhone').value.trim();
    const message = form.querySelector('#contactMessage').value.trim();

    let isValid = true;

    form.querySelectorAll('.error-msg').forEach(el => el.textContent = '');

    if (!name) {
      showFieldError('contactName', 'Vui lòng nhập họ và tên của bạn');
      isValid = false;
    }

    if (!phone) {
      showFieldError('contactPhone', 'Vui lòng nhập số điện thoại');
      isValid = false;
    } else if (!/^[0-9]{9,11}$/.test(phone)) {
      showFieldError('contactPhone', 'Số điện thoại không hợp lệ (9 - 11 chữ số)');
      isValid = false;
    }

    if (!message) {
      showFieldError('contactMessage', 'Vui lòng nhập lời nhắn');
      isValid = false;
    }

    if (!isValid) return;

    showToast(`Cảm ơn ${name}! Tulo Coffee đã nhận được tin nhắn và sẽ liên hệ sớm.`, 'success');
    form.reset();
  });
}

function showFieldError(fieldId, errorText) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('error');
  const errorEl = field.parentElement.querySelector('.error-msg');
  if (errorEl) errorEl.textContent = errorText;

  field.addEventListener('input', function handler() {
    field.classList.remove('error');
    if (errorEl) errorEl.textContent = '';
    field.removeEventListener('input', handler);
  });
}


/* ==========================================================================
   3. LOGIC TRANG THỰC ĐƠN (MENU.HTML)
   ========================================================================== */

function initMenuPage() {
  let activeCategory = 'all';
  let searchQuery = '';
  let sortOption = 'newest';
  let statusFilter = 'all';
  let searchTimer = null;

  const categoryContainer = document.getElementById('menuCategories');
  const searchInput = document.getElementById('menuSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const sortSelect = document.getElementById('menuSortSelect');
  const statusSelect = document.getElementById('menuStatusSelect');

  // Tải danh mục thật từ API GET /api/categories
  async function loadCategories() {
    if (!categoryContainer) return;
    let categories = ['Cà phê', 'Trà', 'Sinh tố', 'Bánh'];
    try {
      const res = await apiRequest('/categories');
      if (Array.isArray(res.data) && res.data.length > 0) {
        categories = res.data.map(c => c.Name);
      }
    } catch {
      // Giữ danh mục mặc định nếu server chưa sẵn sàng
    }

    const allCats = ['all', ...categories];
    const labels = {
      'all': 'Tất cả món',
      'Cà phê': 'Cà phê mộc',
      'Trà': 'Trà hoa quả',
      'Sinh tố': 'Sinh tố tươi',
      'Bánh': 'Bánh nướng'
    };

    function renderCatButtons() {
      categoryContainer.innerHTML = allCats.map(cat => `
        <button type="button" class="pill-btn ${cat === activeCategory ? 'active' : ''}" data-cat="${cat}">
          ${labels[cat] || cat}
        </button>
      `).join('');

      categoryContainer.querySelectorAll('.pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          activeCategory = btn.getAttribute('data-cat');
          renderCatButtons();
          applyFilterAndRender();
        });
      });
    }

    renderCatButtons();
  }

  // Gọi API GET /api/products với tìm kiếm, lọc, sắp xếp
  async function applyFilterAndRender() {
    const grid = document.getElementById('menuProductGrid');
    const resultCountEl = document.getElementById('searchResultCount');
    if (!grid) return;

    const params = new URLSearchParams({
      limit: '50',
      sort: sortOption === 'default' ? 'newest' : sortOption
    });
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (searchQuery.trim() !== '') params.set('keyword', searchQuery.trim());

    try {
      const res = await apiRequest(`/products?${params.toString()}`);
      const items = (res.data || []).map(mapApiProduct);
      window.__menuCache = items;

      if (resultCountEl) {
        resultCountEl.textContent = `Hiển thị ${items.length} món`;
      }

      if (items.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1;">
            <div class="empty-icon" style="color: var(--secondary);">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                <line x1="6" y1="1" x2="6" y2="4"></line>
                <line x1="10" y1="1" x2="10" y2="4"></line>
                <line x1="14" y1="1" x2="14" y2="4"></line>
              </svg>
            </div>
            <h3 class="empty-title">Không tìm thấy món phù hợp</h3>
            <p>Thử tìm với từ khóa khác hoặc chuyển sang danh mục "Tất cả món" nhé!</p>
            <button class="btn btn-outline btn-sm" style="margin-top:16px;" onclick="document.getElementById('clearSearchBtn').click();">
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        `;
        return;
      }

      grid.innerHTML = items.map(item => createProductCardHtml(item)).join('');
    } catch (err) {
      if (resultCountEl) resultCountEl.textContent = 'Lỗi kết nối máy chủ';
      grid.innerHTML = `<p class="text-center" style="grid-column:1/-1; color:#D32F2F;">${escapeHtml(err.message)}</p>`;
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'inline-flex' : 'none';
      }
      clearTimeout(searchTimer);
      searchTimer = setTimeout(applyFilterAndRender, 250);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      applyFilterAndRender();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortOption = e.target.value;
      applyFilterAndRender();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      statusFilter = e.target.value;
      applyFilterAndRender();
    });
  }

  loadCategories();
  applyFilterAndRender();
}

/**
 * Trợ thủ tạo HTML cho thẻ card sản phẩm
 */
function createProductCardHtml(item) {
  const isAvailable = item.status === 'available';
  const badgeClass = isAvailable ? 'badge-available' : 'badge-out';
  const badgeText = isAvailable ? 'Còn hàng' : 'Hết hàng';

  return `
    <article class="product-card" data-id="${item.id}">
      <div class="product-img-wrapper">
        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="product-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500'"/>
        <span class="product-badge ${badgeClass}">${badgeText}</span>
        <span class="product-category-tag">${escapeHtml(item.category)}</span>
      </div>
      <div class="product-body">
        <div class="product-code">Mã: ${item.id}</div>
        <h4 class="product-name">${escapeHtml(item.name)}</h4>
        <p class="product-desc" title="${escapeHtml(item.description)}">${escapeHtml(item.description)}</p>
        <div class="product-footer">
          <div class="product-price">${formatCurrency(item.price)}</div>
          <button type="button" class="btn btn-primary btn-sm" 
            ${!isAvailable ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : `onclick="addToCart('${item.id}')"`}>
            ${isAvailable ? '+ Đặt món' : 'Tạm hết'}
          </button>
        </div>
      </div>
    </article>
  `;
}


/* ==========================================================================
   4. LOGIC TRANG QUẢN LÝ (QUANLY.HTML) - KẾT NỐI BACKEND API
   ========================================================================== */

function initAdminPage() {
  const state = {
    searchKeyword: '',
    categoryFilter: 'all',
    statusFilter: 'all',
    sortBy: 'newest',
    currentPage: 1,
    pageSize: 6,
    editingDbId: null,
    editingCode: null,
    categories: [],
    searchTimer: null
  };

  const searchInput = document.getElementById('adminSearchInput');
  const catSelect = document.getElementById('adminCatFilter');
  const statusSelect = document.getElementById('adminStatusFilter');
  const sortSelect = document.getElementById('adminSortSelect');
  const addBtn = document.getElementById('openAddModalBtn');
  const modalOverlay = document.getElementById('productModal');
  const modalForm = document.getElementById('productForm');
  const modalTitle = document.getElementById('modalTitle');
  const cancelBtn = document.getElementById('cancelModalBtn');
  const closeModalX = document.getElementById('closeModalX');
  const imageInput = document.getElementById('productImage');
  const previewImg = document.getElementById('previewImg');
  const exportBtn = document.getElementById('exportJsonBtn');
  const importInput = document.getElementById('importJsonInput');
  const resetDataBtn = document.getElementById('resetDataBtn');

  // Tạo Banner nhắc đăng nhập Admin + Bảng quản lý Đơn hàng từ API
  injectAdminExtras();

  async function refreshAll() {
    renderAdminAuthBanner();
    await loadCategoriesForAdmin();
    await updateDashboardStats();
    await renderAdminTable();
    await renderAdminOrdersSection();
    await renderAdminStatisticsSection();
    await renderAdminUsersSection();
  }

  window.onAuthChanged = () => {
    refreshAll();
  };

  refreshAll();

  function injectAdminExtras() {
    const mainContainer = document.querySelector('main .container');
    if (!mainContainer) return;

    // 1. Banner cảnh báo nếu chưa đăng nhập quyền Admin
    if (!document.getElementById('adminAuthBanner')) {
      const banner = document.createElement('div');
      banner.id = 'adminAuthBanner';
      banner.style.marginBottom = '20px';
      const statsEl = mainContainer.querySelector('.dashboard-stats');
      if (statsEl) {
        mainContainer.insertBefore(banner, statsEl);
      }
    }

    // 2. Bảng Quản lý Đơn hàng & Thống kê Doanh thu thật từ SQL Server
    if (!document.getElementById('adminOrdersSection')) {
      const section = document.createElement('section');
      section.id = 'adminOrdersSection';
      section.className = 'table-card';
      section.style.marginTop = '32px';
      section.innerHTML = `
        <div class="table-header-bar">
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">Quản Lý Đơn Hàng & Doanh Thu (SQL Server)</h3>
          <span id="adminRevenueBadge" style="font-weight: 700; color: var(--primary);"></span>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã Đơn</th>
                <th>Khách Hàng</th>
                <th>SĐT</th>
                <th>Số Món</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Cập Nhật</th>
              </tr>
            </thead>
            <tbody id="adminOrdersTableBody"></tbody>
          </table>
        </div>
      `;
      mainContainer.appendChild(section);
    }

    // 3. Bảng Thống kê Chi tiết (Top món bán chạy, Danh mục, Doanh thu tháng)
    if (!document.getElementById('adminStatsSection')) {
      const statsSection = document.createElement('section');
      statsSection.id = 'adminStatsSection';
      statsSection.style.marginTop = '32px';
      statsSection.style.display = 'grid';
      statsSection.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
      statsSection.style.gap = '24px';
      statsSection.innerHTML = `
        <div class="table-card" style="margin-bottom:0;">
          <div class="table-header-bar">
            <h3 style="font-family: var(--font-heading); font-size: 1.15rem;">Top Món Bán Chạy (GROUP BY)</h3>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Món</th>
                  <th>Đã Bán</th>
                  <th>Doanh Thu</th>
                </tr>
              </thead>
              <tbody id="adminTopProductsBody"></tbody>
            </table>
          </div>
        </div>

        <div class="table-card" style="margin-bottom:0;">
          <div class="table-header-bar">
            <h3 style="font-family: var(--font-heading); font-size: 1.15rem;">Doanh Thu Theo Danh Mục</h3>
          </div>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Danh Mục</th>
                  <th>Số Món</th>
                  <th>Đã Bán</th>
                  <th>Doanh Thu</th>
                </tr>
              </thead>
              <tbody id="adminCatDistBody"></tbody>
            </table>
          </div>
        </div>

        <div class="table-card" style="grid-column: 1 / -1; margin-bottom:0;">
          <div class="table-header-bar">
            <h3 style="font-family: var(--font-heading); font-size: 1.15rem;">Biểu Đồ Doanh Thu Theo Tháng (2026)</h3>
          </div>
          <div id="adminMonthlyRevenueChart" style="padding: 20px;"></div>
        </div>
      `;
      mainContainer.appendChild(statsSection);
    }

    // 4. Bảng Quản lý Người dùng (Admin)
    if (!document.getElementById('adminUsersSection')) {
      const usersSection = document.createElement('section');
      usersSection.id = 'adminUsersSection';
      usersSection.className = 'table-card';
      usersSection.style.marginTop = '32px';
      usersSection.innerHTML = `
        <div class="table-header-bar">
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">Quản Lý Tài Khoản Người Dùng</h3>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Họ Tên & Email</th>
                <th>SĐT</th>
                <th>Vai Trò</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody id="adminUsersTableBody"></tbody>
          </table>
        </div>
      `;
      mainContainer.appendChild(usersSection);
    }
  }

  function renderAdminAuthBanner() {
    const banner = document.getElementById('adminAuthBanner');
    if (!banner) return;
    const user = getAuthUser();

    if (user && user.role === 'admin') {
      banner.innerHTML = '';
      banner.style.display = 'none';
      return;
    }

    banner.style.display = 'block';
    banner.innerHTML = `
      <div style="background: var(--bg-surface-alt); border: 1px solid var(--accent); border-radius: 12px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div>
          <strong style="color: var(--primary);">🔐 Chế độ xem trước Quản trị:</strong>
          <span style="font-size: 0.9rem; color: var(--text-muted);">
            Để Thêm / Sửa / Xóa món, Duyệt đơn hàng và xem Thống kê doanh thu, vui lòng đăng nhập tài khoản Admin (<code>admin</code> / <code>Admin@123</code>).
          </span>
        </div>
        <button type="button" class="btn btn-primary btn-sm" onclick="openAuthModal()">Đăng Nhập Admin</button>
      </div>
    `;
  }

  async function loadCategoriesForAdmin() {
    try {
      const res = await apiRequest('/categories');
      state.categories = res.data || [];
      const modalCatSelect = document.getElementById('productCategory');
      if (modalCatSelect && state.categories.length > 0) {
        modalCatSelect.innerHTML = state.categories
          .map(c => `<option value="${c.Name}" data-id="${c.Id}">${c.Name}</option>`)
          .join('');
      }
      if (catSelect && state.categories.length > 0) {
        const currentVal = catSelect.value || 'all';
        catSelect.innerHTML = `<option value="all">Tất cả danh mục</option>` +
          state.categories.map(c => `<option value="${c.Name}">${c.Name}</option>`).join('');
        catSelect.value = currentVal;
      }
      renderAdminCategoriesSection();
    } catch {
      state.categories = [];
    }
  }

  function renderAdminCategoriesSection() {
    const mainContainer = document.querySelector('main .container');
    if (!mainContainer) return;

    let catSection = document.getElementById('adminCategoriesSection');
    if (!catSection) {
      catSection = document.createElement('section');
      catSection.id = 'adminCategoriesSection';
      catSection.className = 'table-card';
      catSection.style.marginTop = '32px';
      mainContainer.appendChild(catSection);
    }

    const user = getAuthUser();
    const isAdmin = user && user.role === 'admin';

    catSection.innerHTML = `
      <div class="table-header-bar" style="flex-wrap:wrap; gap:10px;">
        <h3 style="font-family: var(--font-heading); font-size: 1.2rem;">Quản Lý Danh Mục (${state.categories.length})</h3>
        ${isAdmin ? `
          <form id="quickAddCatForm" style="display:flex; gap:8px; flex-wrap:wrap;">
            <input type="text" id="newCatCode" class="form-input" placeholder="Mã (VD: DX)" style="width:95px; padding:6px 10px;" required>
            <input type="text" id="newCatName" class="form-input" placeholder="Tên danh mục mới..." style="width:190px; padding:6px 10px;" required>
            <button type="submit" class="btn btn-primary btn-sm">+ Thêm Danh Mục</button>
          </form>
        ` : ''}
      </div>
      <div style="padding:16px 20px; display:flex; gap:10px; flex-wrap:wrap;">
        ${state.categories.map(c => `
          <div style="border:1px solid var(--border-color); border-radius:10px; padding:8px 14px; display:flex; align-items:center; gap:10px; background:var(--bg-surface-alt);">
            <span><strong>[${c.Code}] ${c.Name}</strong> <small style="color:var(--text-muted);">(${c.ProductCount || 0} món)</small></span>
            ${isAdmin ? `<button type="button" class="btn-icon" style="width:24px; height:24px; color:#D32F2F; border:none;" onclick="handleDeleteCategory(${c.Id}, '${c.Name}')" title="Xóa danh mục">&times;</button>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    const quickForm = document.getElementById('quickAddCatForm');
    if (quickForm) {
      quickForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('newCatCode').value.trim();
        const name = document.getElementById('newCatName').value.trim();
        try {
          await apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify({ code, name, sortOrder: state.categories.length + 1 })
          });
          showToast(`Đã thêm danh mục "${name}"!`, 'success');
          await loadCategoriesForAdmin();
        } catch (err) {
          const detail = err.errors && err.errors[0] ? err.errors[0].message : err.message;
          showToast(detail, 'error');
        }
      });
    }
  }

  window.handleDeleteCategory = async function (catId, catName) {
    if (!confirm(`Xóa danh mục "${catName}"?`)) return;
    try {
      await apiRequest(`/categories/${catId}`, { method: 'DELETE' });
      showToast(`Đã xóa danh mục "${catName}"`, 'info');
      await loadCategoriesForAdmin();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  function getCategoryIdByName(name) {
    const found = state.categories.find(c => c.Name === name);
    return found ? found.Id : 1;
  }

  /* --- 4.1 THỐNG KÊ DASHBOARD TỪ API --- */
  async function updateDashboardStats() {
    try {
      const res = await apiRequest('/products?limit=100');
      const items = (res.data || []).map(mapApiProduct);
      const totalCount = items.length;
      const availableCount = items.filter(i => i.status === 'available').length;
      const outCount = items.filter(i => i.status === 'out_of_stock').length;

      const avgPrice = totalCount > 0
        ? Math.round(items.reduce((sum, i) => sum + Number(i.price), 0) / totalCount)
        : 0;

      let highestItem = null;
      if (totalCount > 0) {
        highestItem = items.reduce((max, i) => (Number(i.price) > Number(max.price) ? i : max), items[0]);
      }

      const elTotal = document.getElementById('statTotalItems');
      const elAvailable = document.getElementById('statAvailable');
      const elOut = document.getElementById('statOutOfStock');
      const elAvg = document.getElementById('statAvgPrice');
      const elMax = document.getElementById('statMaxPrice');

      if (elTotal) elTotal.textContent = totalCount;
      if (elAvailable) elAvailable.textContent = availableCount;
      if (elOut) elOut.textContent = outCount;
      if (elAvg) elAvg.textContent = formatCurrency(avgPrice);
      if (elMax) {
        elMax.textContent = highestItem ? `${highestItem.name} (${formatCurrency(highestItem.price)})` : 'Chưa có';
      }
    } catch {
      // Bỏ qua nếu server chưa bật
    }
  }

  /* --- 4.2 TẢI BẢNG SẢN PHẨM PHÂN TRANG TỪ BACKEND --- */
  async function renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    const paginationEl = document.getElementById('adminPagination');
    if (!tbody) return;

    const params = new URLSearchParams({
      page: String(state.currentPage),
      limit: String(state.pageSize),
      sort: state.sortBy
    });
    if (state.categoryFilter !== 'all') params.set('category', state.categoryFilter);
    if (state.statusFilter !== 'all') params.set('status', state.statusFilter);
    if (state.searchKeyword.trim() !== '') params.set('keyword', state.searchKeyword.trim());

    try {
      const res = await apiRequest(`/products?${params.toString()}`);
      const pageItems = (res.data || []).map(mapApiProduct);
      const pagination = res.pagination || { page: 1, limit: state.pageSize, totalItems: pageItems.length, totalPages: 1 };

      window.__menuCache = pageItems;

      if (pageItems.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 40px 20px;">
              <div class="empty-state" style="padding: 10px;">
                <div class="empty-icon" style="font-size: 2.2rem;">📋</div>
                <p class="empty-title" style="font-size: 1.1rem;">Không tìm thấy món phù hợp</p>
                <p style="font-size: 0.85rem;">Hãy thử đổi từ khóa tìm kiếm hoặc bấm Thêm Món Mới.</p>
              </div>
            </td>
          </tr>
        `;
        if (paginationEl) paginationEl.innerHTML = '';
        return;
      }

      const startIndex = (pagination.page - 1) * pagination.limit;
      tbody.innerHTML = pageItems.map((item, index) => {
        const stt = startIndex + index + 1;
        const isAvailable = item.status === 'available';
        const badgeClass = isAvailable ? 'badge-available' : 'badge-out';
        const badgeText = isAvailable ? 'Còn hàng' : 'Hết hàng';

        return `
          <tr>
            <td><strong>#${stt}</strong></td>
            <td><span style="font-family: monospace; font-weight: 700; color: var(--primary); background: var(--bg-surface-alt); padding: 3px 8px; border-radius: 4px;">${item.id}</span></td>
            <td>
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="table-img" onerror="this.src='https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100'"/>
            </td>
            <td>
              <div style="font-weight: 700;">${escapeHtml(item.name)}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.description || 'Chưa có mô tả')}</div>
            </td>
            <td><span class="pill-btn" style="padding: 3px 10px; font-size: 0.8rem;">${escapeHtml(item.category)}</span></td>
            <td style="font-weight: 700; color: var(--primary);">${formatCurrency(item.price)}</td>
            <td><span class="product-badge ${badgeClass}" style="position:static; display:inline-block;">${badgeText}</span></td>
            <td>
              <div class="table-actions">
                <button class="btn btn-secondary btn-sm" onclick="handleEditProduct('${item.id}')" title="Chỉnh sửa món">✏️ Sửa</button>
                <button class="btn btn-danger btn-sm" onclick="handleDeleteProduct('${item.id}')" title="Xóa món">🗑️ Xóa</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      renderPagination(
        pagination.totalPages || 1,
        pagination.totalItems,
        startIndex + 1,
        Math.min(startIndex + pageItems.length, pagination.totalItems)
      );
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#D32F2F; padding:24px;">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  function renderPagination(totalPages, totalItems, from, to) {
    const paginationEl = document.getElementById('adminPagination');
    if (!paginationEl) return;

    if (totalItems === 0) {
      paginationEl.innerHTML = '';
      return;
    }

    let buttonsHtml = '';
    for (let p = 1; p <= totalPages; p++) {
      buttonsHtml += `
        <button class="page-btn ${p === state.currentPage ? 'active' : ''}" onclick="changeAdminPage(${p})">
          ${p}
        </button>
      `;
    }

    paginationEl.innerHTML = `
      <div>Hiển thị <strong>${from} - ${to}</strong> trên tổng số <strong>${totalItems}</strong> món</div>
      <div class="page-controls">
        <button class="page-btn" ${state.currentPage <= 1 ? 'disabled' : ''} onclick="changeAdminPage(${state.currentPage - 1})">❮</button>
        ${buttonsHtml}
        <button class="page-btn" ${state.currentPage >= totalPages ? 'disabled' : ''} onclick="changeAdminPage(${state.currentPage + 1})">❯</button>
      </div>
    `;
  }

  window.changeAdminPage = function (newPage) {
    state.currentPage = newPage;
    renderAdminTable();
  };

  /* --- 4.2B QUẢN LÝ ĐƠN HÀNG & DOANH THU (CHO ADMIN) --- */
  async function renderAdminOrdersSection() {
    const tbody = document.getElementById('adminOrdersTableBody');
    const revBadge = document.getElementById('adminRevenueBadge');
    if (!tbody) return;

    const user = getAuthUser();
    if (!user || user.role !== 'admin') {
      if (revBadge) revBadge.textContent = '';
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:20px;">Đăng nhập quyền Admin để xem danh sách đơn hàng và doanh thu thực tế.</td></tr>`;
      return;
    }

    try {
      const [ordersRes, overviewRes] = await Promise.all([
        apiRequest('/orders?limit=10'),
        apiRequest('/statistics/overview')
      ]);

      if (revBadge && overviewRes.data) {
        revBadge.textContent = `Tổng doanh thu hoàn thành: ${formatCurrency(overviewRes.data.TotalRevenue)} (${overviewRes.data.TotalOrders} đơn)`;
      }

      const orders = ordersRes.data || [];
      if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Chưa có đơn hàng nào.</td></tr>`;
        return;
      }

      const statusBadge = {
        pending: 'badge-out',
        confirmed: 'badge-available',
        completed: 'badge-available',
        cancelled: 'badge-out'
      };

      tbody.innerHTML = orders.map(o => `
        <tr>
          <td><a href="javascript:void(0)" onclick="viewOrderDetails(${o.Id})" style="font-weight:700; color:var(--primary); text-decoration:underline;" title="Xem chi tiết món">${escapeHtml(o.OrderCode)}</a></td>
          <td>${escapeHtml(o.CustomerName)}</td>
          <td>${escapeHtml(o.CustomerPhone)}</td>
          <td>${o.ItemCount}</td>
          <td style="font-weight:700; color:var(--primary);">${formatCurrency(o.TotalAmount)}</td>
          <td><span class="product-badge ${statusBadge[o.Status] || ''}" style="position:static; display:inline-block;">${o.Status}</span></td>
          <td>
            <select class="form-select" style="padding:4px 8px; font-size:0.85rem;" onchange="handleUpdateOrderStatus(${o.Id}, this.value)">
              <option value="pending" ${o.Status === 'pending' ? 'selected' : ''}>pending</option>
              <option value="confirmed" ${o.Status === 'confirmed' ? 'selected' : ''}>confirmed</option>
              <option value="completed" ${o.Status === 'completed' ? 'selected' : ''}>completed</option>
              <option value="cancelled" ${o.Status === 'cancelled' ? 'selected' : ''}>cancelled</option>
            </select>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#D32F2F;">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  window.handleUpdateOrderStatus = async function (orderId, newStatus) {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      showToast('Cập nhật trạng thái đơn hàng thành công!', 'success');
      await renderAdminOrdersSection();
      await renderAdminStatisticsSection();
    } catch (err) {
      showToast(err.message, 'error');
      renderAdminOrdersSection();
    }
  };

  /* --- 4.2C THỐNG KÊ CHI TIẾT (TOP MÓN, DANH MỤC, DOANH THU THÁNG) --- */
  async function renderAdminStatisticsSection() {
    const topBody = document.getElementById('adminTopProductsBody');
    const catBody = document.getElementById('adminCatDistBody');
    const chartEl = document.getElementById('adminMonthlyRevenueChart');
    if (!topBody || !catBody || !chartEl) return;

    const user = getAuthUser();
    if (!user || user.role !== 'admin') {
      topBody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:18px;">Cần đăng nhập quyền Admin.</td></tr>`;
      catBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:18px;">Cần đăng nhập quyền Admin.</td></tr>`;
      chartEl.innerHTML = `<p style="text-align:center; color:var(--text-muted);">Đăng nhập quyền Admin để xem biểu đồ doanh thu.</p>`;
      return;
    }

    try {
      const [topRes, catRes, revRes] = await Promise.all([
        apiRequest('/statistics/top-products?limit=5'),
        apiRequest('/statistics/category-distribution'),
        apiRequest('/statistics/revenue?year=2026')
      ]);

      const topItems = topRes.data || [];
      topBody.innerHTML = topItems.length === 0
        ? `<tr><td colspan="3" style="text-align:center;">Chưa có dữ liệu bán hàng</td></tr>`
        : topItems.map(p => `
          <tr>
            <td><strong>${escapeHtml(p.ProductName)}</strong><br/><span style="font-size:0.78rem; color:var(--text-muted);">${escapeHtml(p.ProductCode)} • ${escapeHtml(p.CategoryName)}</span></td>
            <td><strong>${p.TotalQuantitySold}</strong> ly</td>
            <td style="font-weight:700; color:var(--primary);">${formatCurrency(p.TotalRevenue)}</td>
          </tr>
        `).join('');

      const cats = catRes.data || [];
      catBody.innerHTML = cats.map(c => `
        <tr>
          <td><strong>${c.CategoryName}</strong></td>
          <td>${c.ProductCount}</td>
          <td>${c.TotalQuantitySold}</td>
          <td style="font-weight:700; color:var(--primary);">${formatCurrency(c.TotalRevenue)}</td>
        </tr>
      `).join('');

      const months = (revRes.data && revRes.data.months) || [];
      const maxRev = Math.max(...months.map(m => m.revenue), 1);
      chartEl.innerHTML = `
        <div style="display:grid; grid-template-columns: repeat(12, 1fr); gap:8px; align-items:end; height:160px; padding-top:20px;">
          ${months.map(m => {
            const pct = Math.max(4, Math.round((m.revenue / maxRev) * 100));
            return `
              <div style="display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;" title="Tháng ${m.month}: ${formatCurrency(m.revenue)} (${m.orderCount} đơn)">
                <div style="font-size:0.68rem; color:var(--text-muted); margin-bottom:4px;">${m.revenue > 0 ? Math.round(m.revenue / 1000) + 'k' : ''}</div>
                <div style="width:100%; max-width:34px; height:${m.revenue > 0 ? pct : 3}%; background:${m.revenue > 0 ? 'var(--primary)' : 'var(--border-color)'}; border-radius:6px 6px 0 0; transition:height 0.3s;"></div>
                <div style="font-size:0.75rem; font-weight:600; margin-top:6px;">T${m.month}</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      chartEl.innerHTML = `<p style="color:#D32F2F;">${escapeHtml(err.message)}</p>`;
    }
  }

  /* --- 4.2D QUẢN LÝ NGƯỜI DÙNG (ADMIN) --- */
  async function renderAdminUsersSection() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    const user = getAuthUser();
    if (!user || user.role !== 'admin') {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:20px;">Đăng nhập quyền Admin để quản lý người dùng.</td></tr>`;
      return;
    }

    try {
      const res = await apiRequest('/users?limit=20');
      const users = res.data || [];

      tbody.innerHTML = users.map(u => {
        const isSelf = u.id === user.id;
        return `
          <tr>
            <td><strong>${escapeHtml(u.username)}</strong></td>
            <td>
              <div style="font-weight:600;">${escapeHtml(u.fullName)}</div>
              <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(u.email)}</div>
            </td>
            <td>${escapeHtml(u.phone || '—')}</td>
            <td>
              <select class="form-select" style="padding:4px 8px; font-size:0.85rem;" ${isSelf ? 'disabled' : ''} onchange="handleChangeUserRole(${u.id}, this.value)">
                <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>customer</option>
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>admin</option>
              </select>
            </td>
            <td>
              <span class="product-badge ${u.isActive ? 'badge-available' : 'badge-out'}" style="position:static; display:inline-block;">
                ${u.isActive ? 'Hoạt động' : 'Đã khóa'}
              </span>
            </td>
            <td>
              <button type="button" class="btn ${u.isActive ? 'btn-danger' : 'btn-secondary'} btn-sm"
                ${isSelf ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : `onclick="handleToggleUserStatus(${u.id}, ${!u.isActive})"`}>
                ${u.isActive ? 'Khóa' : 'Mở khóa'}
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#D32F2F;">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  window.handleToggleUserStatus = async function (userId, nextStatus) {
    try {
      await apiRequest(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus })
      });
      showToast(nextStatus ? 'Đã mở khóa tài khoản!' : 'Đã khóa tài khoản!', 'info');
      renderAdminUsersSection();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.handleChangeUserRole = async function (userId, nextRole) {
    try {
      await apiRequest(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole })
      });
      showToast(`Đã đổi vai trò thành ${nextRole}!`, 'success');
      renderAdminUsersSection();
    } catch (err) {
      showToast(err.message, 'error');
      renderAdminUsersSection();
    }
  };

  /* --- 4.3 SỰ KIỆN TÌM KIẾM, LỌC, SẮP XẾP --- */
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchKeyword = e.target.value;
      state.currentPage = 1;
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(renderAdminTable, 250);
    });
  }

  if (catSelect) {
    catSelect.addEventListener('change', (e) => {
      state.categoryFilter = e.target.value;
      state.currentPage = 1;
      renderAdminTable();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      state.statusFilter = e.target.value;
      state.currentPage = 1;
      renderAdminTable();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderAdminTable();
    });
  }

  /* --- 4.4 MODAL FORM & VALIDATION --- */
  function openModal(isEdit = false, item = null) {
    const user = getAuthUser();
    if (!user || user.role !== 'admin') {
      showToast('Vui lòng đăng nhập bằng tài khoản Admin để thực hiện thao tác này!', 'error');
      openAuthModal();
      return;
    }

    resetValidationErrors();
    const categorySelect = document.getElementById('productCategory');
    const idInput = document.getElementById('productId');

    if (isEdit && item) {
      state.editingDbId = item.dbId;
      state.editingCode = item.id;
      modalTitle.textContent = `Chỉnh Sửa Món [${item.id}]`;
      idInput.value = item.id;
      document.getElementById('productName').value = item.name;
      categorySelect.value = item.category;
      document.getElementById('productPrice').value = item.price;
      document.getElementById('productStatus').value = item.status;
      document.getElementById('productImage').value = item.image || '';
      document.getElementById('productDesc').value = item.description || '';
      previewImg.src = item.image || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100';
    } else {
      state.editingDbId = null;
      state.editingCode = null;
      modalTitle.textContent = 'Thêm Món Mới';
      modalForm.reset();
      idInput.value = 'Tự sinh bởi Server';
      previewImg.src = 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100';
    }

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (addBtn) addBtn.addEventListener('click', () => openModal(false));
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (closeModalX) closeModalX.addEventListener('click', closeModal);

  if (imageInput) {
    imageInput.addEventListener('input', () => {
      const url = imageInput.value.trim();
      previewImg.src = url || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100';
    });
  }

  function resetValidationErrors() {
    modalForm.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    modalForm.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => el.classList.remove('error'));
  }

  function validateProductForm() {
    resetValidationErrors();
    let isValid = true;

    const name = document.getElementById('productName').value.trim();
    const priceStr = document.getElementById('productPrice').value.trim();
    const category = document.getElementById('productCategory').value;
    const status = document.getElementById('productStatus').value;

    if (!name) {
      setFieldError('productName', 'Tên món không được để trống');
      isValid = false;
    } else if (name.length < 2 || name.length > 150) {
      setFieldError('productName', 'Độ dài tên món phải từ 2 đến 150 ký tự');
      isValid = false;
    }

    const price = Number(priceStr);
    if (!priceStr) {
      setFieldError('productPrice', 'Giá bán không được để trống');
      isValid = false;
    } else if (isNaN(price) || price < 1000) {
      setFieldError('productPrice', 'Giá bán tối thiểu là 1.000 ₫');
      isValid = false;
    } else if (price > 10000000) {
      setFieldError('productPrice', 'Giá bán tối đa là 10.000.000 ₫');
      isValid = false;
    }

    if (!category) {
      setFieldError('productCategory', 'Vui lòng chọn danh mục');
      isValid = false;
    }

    if (!status) {
      setFieldError('productStatus', 'Vui lòng chọn trạng thái món');
      isValid = false;
    }

    return isValid;
  }

  function setFieldError(fieldId, msg) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.classList.add('error');
    const errSpan = el.parentElement.querySelector('.error-msg');
    if (errSpan) errSpan.textContent = msg;

    el.addEventListener('input', function onInput() {
      el.classList.remove('error');
      if (errSpan) errSpan.textContent = '';
      el.removeEventListener('input', onInput);
    });
  }

  // Gửi Form Thêm mới / Cập nhật lên Backend API
  if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateProductForm()) {
        showToast('Vui lòng kiểm tra lại thông tin nhập!', 'error');
        return;
      }

      const name = document.getElementById('productName').value.trim();
      const category = document.getElementById('productCategory').value;
      const categoryId = getCategoryIdByName(category);
      const price = Number(document.getElementById('productPrice').value);
      const status = document.getElementById('productStatus').value;
      let image = document.getElementById('productImage').value.trim();
      const description = document.getElementById('productDesc').value.trim();

      if (!image) {
        const defaultImages = {
          "Cà phê": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600",
          "Trà": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600",
          "Sinh tố": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600",
          "Bánh": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600"
        };
        image = defaultImages[category] || defaultImages["Cà phê"];
      }

      const payload = { name, categoryId, price, status, image, description };

      try {
        if (state.editingDbId) {
          await apiRequest(`/products/${state.editingDbId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
          });
          showToast(`Cập nhật món "${name}" thành công!`, 'success');
        } else {
          const res = await apiRequest('/products', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          showToast(`Đã thêm món mới "${name}" (${res.data.Code})!`, 'success');
        }

        closeModal();
        await updateDashboardStats();
        await renderAdminTable();
      } catch (err) {
        const detail = err.errors && err.errors[0] ? err.errors[0].message : err.message;
        showToast(detail, 'error');
      }
    });
  }

  /* --- 4.5 SỬA & XÓA MỀM QUA API --- */
  window.handleEditProduct = function (productCode) {
    const item = window.__menuCache.find(i => i.id === productCode);
    if (!item) {
      showToast('Không tìm thấy sản phẩm!', 'error');
      return;
    }
    openModal(true, item);
  };

  window.handleDeleteProduct = async function (productCode) {
    const user = getAuthUser();
    if (!user || user.role !== 'admin') {
      showToast('Vui lòng đăng nhập bằng tài khoản Admin để xóa món!', 'error');
      openAuthModal();
      return;
    }

    const item = window.__menuCache.find(i => i.id === productCode);
    if (!item) return;

    const isConfirmed = confirm(`Bạn có chắc chắn muốn xóa món "${item.name}" (Mã: ${item.id}) không?`);
    if (!isConfirmed) return;

    try {
      await apiRequest(`/products/${item.dbId}`, { method: 'DELETE' });
      showToast(`Đã xóa món "${item.name}" khỏi thực đơn!`, 'info');
      await updateDashboardStats();
      await renderAdminTable();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  /* --- 4.6 XUẤT JSON TỪ API --- */
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const res = await apiRequest('/products?limit=100');
        const jsonStr = JSON.stringify(res.data || [], null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const today = new Date().toISOString().slice(0, 10);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tulo_coffee_db_backup_${today}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Đã xuất dữ liệu từ SQL Server ra file JSON!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  if (importInput) {
    importInput.addEventListener('change', () => {
      showToast('Dữ liệu hiện được quản lý tập trung tại SQL Server.', 'info');
      importInput.value = '';
    });
  }

  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', () => {
      refreshAll();
      showToast('Đã làm mới dữ liệu từ SQL Server!', 'info');
    });
  }
}
