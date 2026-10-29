/**
 * ==========================================================================
 * TULO COFFEE - LOGIC ỨNG DỤNG (APPLICATION CONTROLLER)
 * Bao gồm:
 * 1. Các tiện ích dùng chung: Dark Mode, Toast, Navigation, Giỏ hàng
 * 2. Trang chủ (index.html): Menu nổi bật, Form liên hệ
 * 3. Trang thực đơn (menu.html): Tìm kiếm không dấu, Lọc danh mục, Sắp xếp
 * 4. Trang quản lý (quanly.html): Thống kê Dashboard, Bảng CRUD, Kiểm tra dữ liệu (Validation),
 *    Phân trang, Xuất/Nhập file JSON, Khôi phục dữ liệu
 * ==========================================================================
 */

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
      <span>${message}</span>
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
 * Quản lý Giỏ hàng (Tính năng mở rộng 1)
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

  // Thanh toán / Đặt món mô phỏng
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const cart = getCartData();
      if (cart.length === 0) {
        showToast('Giỏ hàng đang trống!', 'error');
        return;
      }
      
      const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const confirmOrder = confirm(`Xác nhận đặt ${cart.length} món với tổng thanh toán ${formatCurrency(totalAmount)}?`);
      
      if (confirmOrder) {
        saveCartData([]);
        updateCartBadge();
        renderCartItems();
        closeCart();
        showToast('Đặt món thành công! Tulo Coffee sẽ chuẩn bị ngay.', 'success');
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
 * @param {string} productId Mã sản phẩm
 */
function addToCart(productId) {
  const menu = getMenuData();
  const product = menu.find(p => p.id === productId);

  if (!product) {
    showToast('Không tìm thấy sản phẩm!', 'error');
    return;
  }

  if (product.status === 'out_of_stock') {
    showToast('Món này hiện đang tạm hết hàng!', 'error');
    return;
  }

  const cart = getCartData();
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
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
        <img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100'"/>
        <div class="cart-item-info">
          <div class="cart-item-title">${item.name}</div>
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
window.updateItemQuantity = function(id, delta) {
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
window.removeItemFromCart = function(id) {
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
 * Hiển thị 4 món tiêu biểu trên trang chủ
 */
function renderFeaturedMenu() {
  const container = document.getElementById('featuredMenuGrid');
  if (!container) return;

  const menu = getMenuData();
  // Lấy 4 món đầu tiên còn hàng để giới thiệu
  const featured = menu.filter(item => item.status === 'available').slice(0, 4);

  if (featured.length === 0) {
    container.innerHTML = `<p class="text-center" style="grid-column: 1/-1;">Đang cập nhật thực đơn nổi bật...</p>`;
    return;
  }

  container.innerHTML = featured.map(item => createProductCardHtml(item)).join('');
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

    // Reset lỗi cũ
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

    // Thành công: Thông báo và reset form
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
  let sortOption = 'default';
  let statusFilter = 'all';

  const categoryContainer = document.getElementById('menuCategories');
  const searchInput = document.getElementById('menuSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const sortSelect = document.getElementById('menuSortSelect');
  const statusSelect = document.getElementById('menuStatusSelect');

  // Khởi tạo các nút danh mục
  function renderCategories() {
    if (!categoryContainer) return;
    const categories = ['all', 'Cà phê', 'Trà', 'Sinh tố', 'Bánh'];
    const labels = {
      'all': 'Tất cả món',
      'Cà phê': 'Cà phê mộc',
      'Trà': 'Trà hoa quả',
      'Sinh tố': 'Sinh tố tươi',
      'Bánh': 'Bánh nướng'
    };

    categoryContainer.innerHTML = categories.map(cat => `
      <button type="button" class="pill-btn ${cat === activeCategory ? 'active' : ''}" data-cat="${cat}">
        ${labels[cat] || cat}
      </button>
    `).join('');

    categoryContainer.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-cat');
        renderCategories();
        applyFilterAndRender();
      });
    });
  }

  // Lọc và hiển thị danh sách sản phẩm
  function applyFilterAndRender() {
    const grid = document.getElementById('menuProductGrid');
    const resultCountEl = document.getElementById('searchResultCount');
    if (!grid) return;

    let items = getMenuData();

    // 1. Lọc theo danh mục
    if (activeCategory !== 'all') {
      items = items.filter(item => item.category === activeCategory);
    }

    // 2. Lọc theo trạng thái
    if (statusFilter === 'available') {
      items = items.filter(item => item.status === 'available');
    }

    // 3. Tìm kiếm theo tên (Không phân biệt hoa thường và bỏ dấu tiếng Việt)
    if (searchQuery.trim() !== '') {
      const normalizedQuery = removeVietnameseTones(searchQuery);
      items = items.filter(item => {
        const normalizedName = removeVietnameseTones(item.name);
        const normalizedDesc = removeVietnameseTones(item.description);
        const normalizedCode = item.id.toLowerCase();
        return normalizedName.includes(normalizedQuery) || 
               normalizedDesc.includes(normalizedQuery) ||
               normalizedCode.includes(normalizedQuery);
      });
    }

    // 4. Sắp xếp dữ liệu
    if (sortOption === 'price-asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'name-asc') {
      items.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }

    // Cập nhật số lượng kết quả
    if (resultCountEl) {
      resultCountEl.textContent = `Hiển thị ${items.length} món`;
    }

    // Xử lý trường hợp không tìm thấy món phù hợp
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
  }

  // Sự kiện ô tìm kiếm
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (clearSearchBtn) {
        clearSearchBtn.style.display = searchQuery ? 'inline-flex' : 'none';
      }
      applyFilterAndRender();
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

  // Sự kiện sắp xếp
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortOption = e.target.value;
      applyFilterAndRender();
    });
  }

  // Sự kiện lọc trạng thái
  if (statusSelect) {
    statusSelect.addEventListener('change', (e) => {
      statusFilter = e.target.value;
      applyFilterAndRender();
    });
  }

  // Khởi động
  renderCategories();
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
        <img src="${item.image}" alt="${item.name}" class="product-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500'"/>
        <span class="product-badge ${badgeClass}">${badgeText}</span>
        <span class="product-category-tag">${item.category}</span>
      </div>
      <div class="product-body">
        <div class="product-code">Mã: ${item.id}</div>
        <h4 class="product-name">${item.name}</h4>
        <p class="product-desc" title="${item.description}">${item.description}</p>
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
   4. LOGIC TRANG QUẢN LÝ (QUANLY.HTML) - TRỌNG TÂM ĐỀ BÀI
   ========================================================================== */

function initAdminPage() {
  // Trạng thái cục bộ của trang quản trị
  const state = {
    searchKeyword: '',
    categoryFilter: 'all',
    statusFilter: 'all',
    sortBy: 'newest',
    currentPage: 1,
    pageSize: 6,
    editingId: null   // null: đang thêm mới, string: đang sửa mã đó
  };

  // Các phần tử DOM chính
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

  // Khởi động giao diện
  updateDashboardStats();
  renderAdminTable();

  /* --- 4.1 TÍNH TOÁN & HIỂN THỊ THỐNG KÊ DASHBOARD --- */
  function updateDashboardStats() {
    const items = getMenuData();
    const totalCount = items.length;
    const availableCount = items.filter(i => i.status === 'available').length;
    const outCount = items.filter(i => i.status === 'out_of_stock').length;

    // Giá trung bình
    const avgPrice = totalCount > 0 
      ? Math.round(items.reduce((sum, i) => sum + Number(i.price), 0) / totalCount)
      : 0;

    // Món có giá cao nhất
    let highestItem = null;
    if (totalCount > 0) {
      highestItem = items.reduce((max, i) => (Number(i.price) > Number(max.price) ? i : max), items[0]);
    }

    // Gán dữ liệu lên thẻ DOM
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
  }

  /* --- 4.2 LỌC, SẮP XẾP, PHÂN TRANG VÀ RENDER BẢNG DỮ LIỆU --- */
  function getFilteredItems() {
    let items = getMenuData();

    // Lọc theo danh mục
    if (state.categoryFilter !== 'all') {
      items = items.filter(i => i.category === state.categoryFilter);
    }

    // Lọc theo trạng thái
    if (state.statusFilter !== 'all') {
      items = items.filter(i => i.status === state.statusFilter);
    }

    // Tìm kiếm theo Mã món hoặc Tên món (không dấu, không phân biệt hoa thường)
    if (state.searchKeyword.trim() !== '') {
      const q = removeVietnameseTones(state.searchKeyword);
      items = items.filter(i => {
        const nameClean = removeVietnameseTones(i.name);
        const codeClean = i.id.toLowerCase();
        return nameClean.includes(q) || codeClean.includes(q);
      });
    }

    // Sắp xếp
    if (state.sortBy === 'price-asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === 'price-desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (state.sortBy === 'name-asc') {
      items.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else {
      // Mặc định: Mới nhất theo createdAt
      items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return items;
  }

  function renderAdminTable() {
    const tbody = document.getElementById('adminTableBody');
    const paginationEl = document.getElementById('adminPagination');
    if (!tbody) return;

    const filteredItems = getFilteredItems();
    const totalItems = filteredItems.length;
    const totalPages = Math.ceil(totalItems / state.pageSize) || 1;

    // Điều chỉnh trang hiện tại nếu bị vượt ngưỡng
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    // Cắt mảng theo trang (Pagination slice)
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const pageItems = filteredItems.slice(startIndex, startIndex + state.pageSize);

    // Trường hợp danh sách rỗng hoặc không tìm thấy
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

    // Render từng hàng (Row) trong bảng
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
            <img src="${item.image}" alt="${item.name}" class="table-img" onerror="this.src='https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100'"/>
          </td>
          <td>
            <div style="font-weight: 700;">${item.name}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.description || 'Chưa có mô tả'}</div>
          </td>
          <td><span class="pill-btn" style="padding: 3px 10px; font-size: 0.8rem;">${item.category}</span></td>
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

    // Render thanh phân trang
    renderPagination(totalPages, totalItems, startIndex + 1, Math.min(startIndex + state.pageSize, totalItems));
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

  // Chuyển trang (gắn vào window để gọi từ HTML)
  window.changeAdminPage = function(newPage) {
    state.currentPage = newPage;
    renderAdminTable();
  };

  /* --- 4.3 SỰ KIỆN TÌM KIẾM, LỌC, SẮP XẾP --- */
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchKeyword = e.target.value;
      state.currentPage = 1;
      renderAdminTable();
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

  /* --- 4.4 MODAL FORM & XỬ LÝ KIỂM TRA DỮ LIỆU (VALIDATION) --- */
  function openModal(isEdit = false, item = null) {
    resetValidationErrors();
    const categorySelect = document.getElementById('productCategory');
    const idInput = document.getElementById('productId');

    if (isEdit && item) {
      state.editingId = item.id;
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
      state.editingId = null;
      modalTitle.textContent = 'Thêm Món Mới';
      modalForm.reset();
      // Tự sinh mã dựa trên danh mục mặc định
      const currentList = getMenuData();
      idInput.value = generateProductCode(categorySelect.value, currentList);
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

  // Khi người dùng đổi danh mục ở chế độ Thêm mới -> Tự cập nhật mã món theo tiền tố mới
  const categorySelect = document.getElementById('productCategory');
  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      if (!state.editingId) {
        const currentList = getMenuData();
        document.getElementById('productId').value = generateProductCode(categorySelect.value, currentList);
      }
    });
  }

  // Xem trước ảnh khi thay đổi URL
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

  /**
   * Kiểm tra tính hợp lệ của dữ liệu nhập (Validation)
   * Yêu cầu:
   * - Không để trống các trường bắt buộc
   * - Tên từ 3 - 100 ký tự, không trùng lặp tên món khác
   * - Giá phải là số dương (> 0), tối đa 10 triệu
   */
  function validateProductForm() {
    resetValidationErrors();
    let isValid = true;
    const currentList = getMenuData();

    const name = document.getElementById('productName').value.trim();
    const priceStr = document.getElementById('productPrice').value.trim();
    const category = document.getElementById('productCategory').value;
    const status = document.getElementById('productStatus').value;

    // 1. Kiểm tra Tên món
    if (!name) {
      setFieldError('productName', 'Tên món không được để trống');
      isValid = false;
    } else if (name.length < 3 || name.length > 100) {
      setFieldError('productName', 'Độ dài tên món phải từ 3 đến 100 ký tự');
      isValid = false;
    } else {
      // Kiểm tra trùng tên (ngoại trừ chính món đang sửa)
      const isDuplicate = currentList.some(item => {
        if (state.editingId && item.id === state.editingId) return false;
        return removeVietnameseTones(item.name) === removeVietnameseTones(name);
      });

      if (isDuplicate) {
        setFieldError('productName', 'Tên món này đã tồn tại trong thực đơn');
        isValid = false;
      }
    }

    // 2. Kiểm tra Giá
    const price = Number(priceStr);
    if (!priceStr) {
      setFieldError('productPrice', 'Giá bán không được để trống');
      isValid = false;
    } else if (isNaN(price) || price <= 0) {
      setFieldError('productPrice', 'Giá bán phải là số lớn hơn 0');
      isValid = false;
    } else if (price > 10000000) {
      setFieldError('productPrice', 'Giá bán tối đa là 10.000.000 ₫');
      isValid = false;
    }

    // 3. Kiểm tra Danh mục
    if (!category) {
      setFieldError('productCategory', 'Vui lòng chọn danh mục');
      isValid = false;
    }

    // 4. Kiểm tra Trạng thái
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

    // Tự xóa lỗi khi người dùng gõ lại
    el.addEventListener('input', function onInput() {
      el.classList.remove('error');
      if (errSpan) errSpan.textContent = '';
      el.removeEventListener('input', onInput);
    });
  }

  // Xử lý gửi Form (Thêm mới hoặc Cập nhật)
  if (modalForm) {
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateProductForm()) {
        showToast('Vui lòng kiểm tra lại thông tin nhập!', 'error');
        return;
      }

      let currentList = getMenuData();
      const code = document.getElementById('productId').value.trim();
      const name = document.getElementById('productName').value.trim();
      const category = document.getElementById('productCategory').value;
      const price = Number(document.getElementById('productPrice').value);
      const status = document.getElementById('productStatus').value;
      let image = document.getElementById('productImage').value.trim();
      const description = document.getElementById('productDesc').value.trim();

      // Nếu không nhập ảnh, chọn ảnh mặc định theo danh mục
      if (!image) {
        const defaultImages = {
          "Cà phê": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600",
          "Trà": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600",
          "Sinh tố": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600",
          "Bánh": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600"
        };
        image = defaultImages[category] || defaultImages["Cà phê"];
      }

      if (state.editingId) {
        // Cập nhật món đã có
        const index = currentList.findIndex(i => i.id === state.editingId);
        if (index !== -1) {
          currentList[index] = {
            ...currentList[index],
            name,
            category,
            price,
            status,
            image,
            description
          };
          saveMenuData(currentList);
          showToast(`Cập nhật món "${name}" thành công!`, 'success');
        }
      } else {
        // Thêm món mới
        const newProduct = {
          id: code,
          name,
          category,
          price,
          status,
          image,
          description,
          createdAt: Date.now()
        };
        currentList.unshift(newProduct);
        saveMenuData(currentList);
        showToast(`Đã thêm món mới "${name}" (${code})!`, 'success');
      }

      closeModal();
      updateDashboardStats();
      renderAdminTable();
    });
  }

  /* --- 4.5 CHỨC NĂNG SỬA & XÓA GẮN VÀO WINDOW --- */
  window.handleEditProduct = function(productId) {
    const list = getMenuData();
    const item = list.find(i => i.id === productId);
    if (!item) {
      showToast('Không tìm thấy sản phẩm!', 'error');
      return;
    }
    openModal(true, item);
  };

  window.handleDeleteProduct = function(productId) {
    const list = getMenuData();
    const item = list.find(i => i.id === productId);
    if (!item) return;

    const isConfirmed = confirm(`Bạn có chắc chắn muốn xóa món "${item.name}" (Mã: ${item.id}) không?\nHành động này không thể hoàn tác!`);
    if (isConfirmed) {
      const updatedList = list.filter(i => i.id !== productId);
      saveMenuData(updatedList);
      showToast(`Đã xóa món "${item.name}" khỏi hệ thống!`, 'info');
      updateDashboardStats();
      renderAdminTable();
    }
  };

  /* --- 4.6 TÍNH NĂNG MỞ RỘNG: XUẤT / NHẬP JSON & KHÔI PHỤC DỮ LIỆU --- */
  // 1. Xuất dữ liệu ra file JSON
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = getMenuData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const today = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tulo_coffee_backup_${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Đã xuất toàn bộ dữ liệu ra file JSON thành công!', 'success');
    });
  }

  // 2. Nhập dữ liệu từ file JSON
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          const imported = JSON.parse(evt.target.result);
          if (!Array.isArray(imported)) {
            throw new Error('Dữ liệu không đúng định dạng mảng');
          }

          // Kiểm tra cấu trúc cơ bản
          const isValid = imported.every(i => i.id && i.name && typeof i.price === 'number');
          if (!isValid) {
            throw new Error('Các bản ghi thiếu thông tin bắt buộc (id, name, price)');
          }

          saveMenuData(imported);
          updateDashboardStats();
          state.currentPage = 1;
          renderAdminTable();
          showToast(`Nhập dữ liệu thành công! Đã tải ${imported.length} món.`, 'success');
        } catch (err) {
          console.error(err);
          showToast('File JSON không hợp lệ hoặc sai định dạng!', 'error');
        } finally {
          importInput.value = '';
        }
      };
      reader.readAsText(file);
    });
  }

  // 3. Khôi phục dữ liệu mẫu
  if (resetDataBtn) {
    resetDataBtn.addEventListener('click', () => {
      const ok = confirm('Bạn có muốn khôi phục lại 14 món mẫu ban đầu của Tulo Coffee không?');
      if (ok) {
        resetMenuToDefault();
        updateDashboardStats();
        state.currentPage = 1;
        renderAdminTable();
        showToast('Đã khôi phục dữ liệu mẫu ban đầu!', 'success');
      }
    });
  }
}
