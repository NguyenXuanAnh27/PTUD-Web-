    (function () {
      'use strict';

      /* ------------------------------------------------------------------------
         1. DEFAULT SAMPLE DATA (6 món chuẩn Unsplash cực đẹp)
         ------------------------------------------------------------------------ */
      const DEFAULT_SAMPLE_ITEMS = [
        {
          id: 'CF001',
          name: 'Cà Phê Muối Xứ Huế',
          category: 'Cà phê',
          price: 35000,
          quantity: 28,
          status: 'Còn hàng',
          image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80'
        },
        {
          id: 'CF002',
          name: 'Espresso Robusta Đậm Đà',
          category: 'Cà phê',
          price: 30000,
          quantity: 45,
          status: 'Còn hàng',
          image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&auto=format&fit=crop&q=80'
        },
        {
          id: 'TR001',
          name: 'Trà Đào Cam Sả Tươi Mát',
          category: 'Trà',
          price: 45000,
          quantity: 18,
          status: 'Còn hàng',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80'
        },
        {
          id: 'TR002',
          name: 'Trà Sữa Oolong Nướng Trân Châu',
          category: 'Trà',
          price: 42000,
          quantity: 0,
          status: 'Hết hàng',
          image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80'
        },
        {
          id: 'BN001',
          name: 'Bánh Croissant Bơ Tỏi Pháp',
          category: 'Bánh ngọt',
          price: 38000,
          quantity: 12,
          status: 'Còn hàng',
          image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=80'
        },
        {
          id: 'BN002',
          name: 'Bánh Tiramisu Mascarpone Ý',
          category: 'Bánh ngọt',
          price: 55000,
          quantity: 0,
          status: 'Hết hàng',
          image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&auto=format&fit=crop&q=80'
        }
      ];

      const STORAGE_KEY = 'tulo_coffee_menu_items_v1';
      const THEME_KEY = 'tulo_coffee_theme_mode';

      /* ------------------------------------------------------------------------
         2. APPLICATION STATE
         ------------------------------------------------------------------------ */
      let menuItems = [];
      let currentEditingId = null; // null => Add Mode, string => Edit Mode
      let currentDeletingId = null;

      // Filter & Search State
      const filterState = {
        search: '',
        category: 'ALL',
        status: 'ALL',
        sort: 'default'
      };

      /* ------------------------------------------------------------------------
         3. DOM ELEMENT REFERENCES
         ------------------------------------------------------------------------ */
      const menuTableBody = document.getElementById('menuTableBody');
      const emptyState = document.getElementById('emptyState');
      const filteredCountBadge = document.getElementById('filteredCountBadge');

      // Stats Elements
      const statTotalItems = document.getElementById('statTotalItems');
      const statInStock = document.getElementById('statInStock');
      const statOutStock = document.getElementById('statOutStock');
      const statInventoryValue = document.getElementById('statInventoryValue');

      // Controls
      const searchInput = document.getElementById('searchInput');
      const clearSearchBtn = document.getElementById('clearSearchBtn');
      const categoryFilter = document.getElementById('categoryFilter');
      const statusFilter = document.getElementById('statusFilter');
      const sortSelect = document.getElementById('sortSelect');
      const resetFiltersBtn = document.getElementById('resetFiltersBtn');
      const emptyResetBtn = document.getElementById('emptyResetBtn');

      // Header Buttons
      const openAddModalBtn = document.getElementById('openAddModalBtn');
      const resetDataBtn = document.getElementById('resetDataBtn');
      const exportCsvBtn = document.getElementById('exportCsvBtn');
      const themeToggleBtn = document.getElementById('themeToggleBtn');

      // Add/Edit Modal Elements
      const itemModal = document.getElementById('itemModal');
      const itemForm = document.getElementById('itemForm');
      const modalTitleText = document.getElementById('modalTitleText');
      const closeModalBtn = document.getElementById('closeModalBtn');
      const cancelModalBtn = document.getElementById('cancelModalBtn');
      const saveItemBtn = document.getElementById('saveItemBtn');

      // Form Inputs
      const itemIdInput = document.getElementById('itemIdInput');
      const itemNameInput = document.getElementById('itemNameInput');
      const itemCategoryInput = document.getElementById('itemCategoryInput');
      const itemPriceInput = document.getElementById('itemPriceInput');
      const itemQuantityInput = document.getElementById('itemQuantityInput');
      const itemStatusInput = document.getElementById('itemStatusInput');
      const itemImageInput = document.getElementById('itemImageInput');
      const formImagePreview = document.getElementById('formImagePreview');

      // Form Error Labels
      const errorId = document.getElementById('errorId');
      const errorName = document.getElementById('errorName');
      const errorPrice = document.getElementById('errorPrice');
      const errorQuantity = document.getElementById('errorQuantity');

      // Delete Modal
      const deleteModal = document.getElementById('deleteModal');
      const deleteItemName = document.getElementById('deleteItemName');
      const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
      const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

      // Reset Modal
      const resetConfirmModal = document.getElementById('resetConfirmModal');
      const cancelResetBtn = document.getElementById('cancelResetBtn');
      const confirmResetBtn = document.getElementById('confirmResetBtn');

      // Toast Container
      const toastContainer = document.getElementById('toastContainer');

      /* ------------------------------------------------------------------------
         4. STORAGE & INITIALIZATION
         ------------------------------------------------------------------------ */
      function loadItemsFromStorage() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          try {
            const parsed = JSON.parse(stored);
            // Chỉ dùng dữ liệu mẫu khi JSON bị lỗi hoặc không phải mảng (không reset khi mảng rỗng)
            menuItems = Array.isArray(parsed) ? parsed : [...DEFAULT_SAMPLE_ITEMS];
            if (!Array.isArray(parsed)) saveItemsToStorage();
          } catch (e) {
            console.error('Lỗi phân tích localStorage:', e);
            menuItems = [...DEFAULT_SAMPLE_ITEMS];
            saveItemsToStorage();
          }
        } else {
          // Lần đầu truy cập: chưa có dữ liệu → nạp mẫu
          menuItems = [...DEFAULT_SAMPLE_ITEMS];
          saveItemsToStorage();
        }
      }

      function saveItemsToStorage() {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(menuItems));
        } catch (e) {
          showToast('Lỗi lưu trữ', 'Không thể lưu vào localStorage (bộ nhớ đầy hoặc bị chặn)', 'error');
        }
      }

      /* ------------------------------------------------------------------------
         5. FORMATTERS & HELPERS
         ------------------------------------------------------------------------ */
      function formatVND(amount) {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          maximumFractionDigits: 0
        }).format(amount || 0);
      }

      function escapeHtml(text) {
        if (!text) return '';
        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
      }

      function sanitizeUrl(url) {
        if (!url || typeof url !== 'string') {
          return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400';
        }
        return url.trim();
      }

      /* ------------------------------------------------------------------------
         6. THEME TOGGLE (DARK / LIGHT)
         ------------------------------------------------------------------------ */
      function initTheme() {
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === 'dark') {
          document.body.classList.add('dark-mode');
        } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.body.classList.add('dark-mode');
        }
        updateThemeIcon();
      }

      function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
        updateThemeIcon();
        showToast('Giao diện', isDark ? 'Đã bật chế độ Tối (Dark Mode)' : 'Đã bật chế độ Sáng (Light Mode)', 'info');
      }

      function updateThemeIcon() {
        const isDark = document.body.classList.contains('dark-mode');
        const iconSvg = isDark
          ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
          : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
        themeToggleBtn.innerHTML = iconSvg;
      }

      /* ------------------------------------------------------------------------
         7. STATS CALCULATION (4 THẺ THỐNG KÊ TỰ ĐỘNG)
         ------------------------------------------------------------------------ */
      function calculateAndRenderStats() {
        const total = menuItems.length;
        let inStockCount = 0;
        let outStockCount = 0;
        let totalValue = 0;

        menuItems.forEach(item => {
          const qty = Number(item.quantity) || 0;
          const price = Number(item.price) || 0;

          if (item.status === 'Còn hàng' && qty > 0) {
            inStockCount++;
          } else {
            outStockCount++;
          }

          totalValue += (price * qty);
        });

        statTotalItems.textContent = total;
        statInStock.textContent = inStockCount;
        statOutStock.textContent = outStockCount;
        statInventoryValue.textContent = formatVND(totalValue);
      }

      /* ------------------------------------------------------------------------
         8. FILTERING, SEARCHING & SORTING
         ------------------------------------------------------------------------ */
      function getProcessedItems() {
        let result = [...menuItems];

        // 1. Search Query (Tên món hoặc Mã món)
        if (filterState.search.trim() !== '') {
          const q = filterState.search.trim().toLowerCase();
          result = result.filter(item =>
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.id && item.id.toLowerCase().includes(q))
          );
        }

        // 2. Category Filter
        if (filterState.category !== 'ALL') {
          result = result.filter(item => item.category === filterState.category);
        }

        // 3. Status Filter
        if (filterState.status !== 'ALL') {
          result = result.filter(item => item.status === filterState.status);
        }

        // 4. Sort
        switch (filterState.sort) {
          case 'price-asc':
            result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
            break;
          case 'price-desc':
            result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
            break;
          case 'name-asc':
            result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
            break;
          case 'name-desc':
            result.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'vi'));
            break;
          case 'stock-desc':
            result.sort((a, b) => (Number(b.quantity) || 0) - (Number(a.quantity) || 0));
            break;
          case 'stock-asc':
            result.sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0));
            break;
          case 'default':
          default:
            // Maintain order or newest
            break;
        }

        return result;
      }

      /* ------------------------------------------------------------------------
         9. RENDER TABLE
         ------------------------------------------------------------------------ */
      function renderTable() {
        const filteredList = getProcessedItems();

        // Update count badge
        filteredCountBadge.textContent = `${filteredList.length} / ${menuItems.length} món`;

        // Check empty state
        if (filteredList.length === 0) {
          menuTableBody.innerHTML = '';
          emptyState.style.display = 'block';
          return;
        }

        emptyState.style.display = 'none';

        // Render rows
        const rowsHtml = filteredList.map(item => {
          // Category badge class
          let catClass = 'cafe';
          if (item.category === 'Trà') catClass = 'tra';
          if (item.category === 'Bánh ngọt') catClass = 'banh';

          // Status & Quantity styling
          const isOutOfStock = item.status === 'Hết hàng' || item.quantity === 0;
          const statusClass = isOutOfStock ? 'status-out-stock' : 'status-in-stock';
          const statusText = isOutOfStock ? 'Hết hàng' : 'Còn hàng';

          let qtyDisplayClass = '';
          if (item.quantity === 0) qtyDisplayClass = 'quantity-zero';
          else if (item.quantity <= 5) qtyDisplayClass = 'quantity-low';

          const safeImgUrl = sanitizeUrl(item.image);

          return `
            <tr data-id="${escapeHtml(item.id)}">
              <td>
                <span class="item-id-badge">${escapeHtml(item.id)}</span>
              </td>
              <td>
                <div class="item-cell-info">
                  <div class="item-image-wrapper">
                    <img
                      src="${escapeHtml(safeImgUrl)}"
                      alt="${escapeHtml(item.name)}"
                      class="item-thumbnail"
                      loading="lazy"
                      onerror="this.src='https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150';"
                    >
                  </div>
                  <div>
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-subtle);">Mã: ${escapeHtml(item.id)}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="category-badge ${catClass}">
                  ${getCategoryIcon(item.category)}
                  ${escapeHtml(item.category)}
                </span>
              </td>
              <td>
                <span class="price-value">${formatVND(item.price)}</span>
              </td>
              <td>
                <div style="display:flex;align-items:center;gap:0.4rem;">
                  <button
                    class="qty-btn qty-btn-dec"
                    title="Giảm 1 đơn vị"
                    data-action="qty-dec"
                    data-id="${escapeHtml(item.id)}"
                    style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-subtle);color:var(--text-muted);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:1rem;line-height:1;transition:all 0.15s;flex-shrink:0;"
                  >−</button>
                  <span class="quantity-value ${qtyDisplayClass}" style="min-width:42px;text-align:center;">
                    ${item.quantity}
                  </span>
                  <button
                    class="qty-btn qty-btn-inc"
                    title="Tăng 1 đơn vị"
                    data-action="qty-inc"
                    data-id="${escapeHtml(item.id)}"
                    style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border-color);background:var(--bg-subtle);color:var(--text-muted);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:1rem;line-height:1;transition:all 0.15s;flex-shrink:0;"
                  >+</button>
                </div>
              </td>
              <td>
                <span class="status-badge ${statusClass}">
                  <span class="status-dot"></span>
                  ${statusText}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="table-actions" style="justify-content: flex-end;">
                  <button
                    class="action-btn view-btn"
                    title="Xem chi tiết món ${escapeHtml(item.name)}"
                    data-action="view"
                    data-id="${escapeHtml(item.id)}"
                    style="color:var(--text-muted);"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  <button
                    class="action-btn edit-btn"
                    title="Chỉnh sửa món ${escapeHtml(item.name)}"
                    data-action="edit"
                    data-id="${escapeHtml(item.id)}"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    class="action-btn delete-btn"
                    title="Xóa món ${escapeHtml(item.name)}"
                    data-action="delete"
                    data-id="${escapeHtml(item.id)}"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');

        menuTableBody.innerHTML = rowsHtml;
      }

      function getCategoryIcon(cat) {
        if (cat === 'Cà phê') {
          return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path></svg>`;
        }
        if (cat === 'Trà') {
          return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20"></path><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"></path><path d="M12 2v10"></path></svg>`;
        }
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="m4.93 4.93 4.24 4.24"></path></svg>`;
      }

      /* ------------------------------------------------------------------------
         10. FORM VALIDATION & MODAL CONTROLS
         ------------------------------------------------------------------------ */
      function clearFormErrors() {
        const errorImage = document.getElementById('errorImage');
        [errorId, errorName, errorPrice, errorQuantity, errorImage].forEach(errEl => {
          if (errEl) errEl.classList.remove('visible');
        });
        [itemIdInput, itemNameInput, itemPriceInput, itemQuantityInput, itemImageInput].forEach(inp => {
          inp.classList.remove('is-invalid');
        });
      }

      function validateFormData() {
        clearFormErrors();
        let isValid = true;

        const errorImage = document.getElementById('errorImage');
        const idVal = itemIdInput.value.trim().toUpperCase();
        const nameVal = itemNameInput.value.trim();
        const priceVal = parseFloat(itemPriceInput.value);
        const qtyRaw = itemQuantityInput.value.trim();
        const qtyNum = Number(qtyRaw);
        const imageVal = itemImageInput.value.trim();

        // 1. Mã món validation
        if (!idVal) {
          errorId.textContent = 'Vui lòng nhập mã món (VD: CF001)';
          errorId.classList.add('visible');
          itemIdInput.classList.add('is-invalid');
          isValid = false;
        } else {
          const isDuplicate = menuItems.some(item =>
            item.id.toUpperCase() === idVal && item.id !== currentEditingId
          );
          if (isDuplicate) {
            errorId.textContent = 'Mã món đã tồn tại trong hệ thống, vui lòng chọn mã khác';
            errorId.classList.add('visible');
            itemIdInput.classList.add('is-invalid');
            isValid = false;
          }
        }

        // 2. Tên món validation
        if (!nameVal || nameVal.length < 2) {
          errorName.textContent = 'Tên món không được để trống (tối thiểu 2 ký tự)';
          errorName.classList.add('visible');
          itemNameInput.classList.add('is-invalid');
          isValid = false;
        }

        // 3. Giá bán validation
        if (isNaN(priceVal) || priceVal <= 0) {
          errorPrice.textContent = 'Giá bán phải là số dương lớn hơn 0 VNĐ';
          errorPrice.classList.add('visible');
          itemPriceInput.classList.add('is-invalid');
          isValid = false;
        }

        // 4. Số lượng tồn kho: phải là số nguyên không âm
        if (qtyRaw === '' || isNaN(qtyNum) || qtyNum < 0) {
          errorQuantity.textContent = 'Số lượng tồn kho không được là số âm (>= 0)';
          errorQuantity.classList.add('visible');
          itemQuantityInput.classList.add('is-invalid');
          isValid = false;
        } else if (!Number.isInteger(qtyNum)) {
          errorQuantity.textContent = 'Số lượng tồn kho phải là số nguyên (không nhập số thập phân như 2.5)';
          errorQuantity.classList.add('visible');
          itemQuantityInput.classList.add('is-invalid');
          isValid = false;
        }

        // 5. Link hình ảnh: nếu có nhập thì bắt buộc phải là http:// hoặc https://
        if (imageVal && !(/^https?:\/\//i.test(imageVal))) {
          if (errorImage) {
            errorImage.textContent = 'Link hình ảnh phải bắt đầu bằng http:// hoặc https://';
            errorImage.classList.add('visible');
          }
          itemImageInput.classList.add('is-invalid');
          isValid = false;
        }

        return isValid;
      }

      // Tự động chuyển trạng thái thành 'Hết hàng' nếu số lượng = 0
      function handleQuantityChange() {
        const qty = parseFloat(itemQuantityInput.value);
        if (!isNaN(qty)) {
          if (qty === 0) {
            itemStatusInput.value = 'Hết hàng';
          } else if (qty > 0 && itemStatusInput.value === 'Hết hàng') {
            itemStatusInput.value = 'Còn hàng';
          }
        }
      }

      function handleStatusChange() {
        const qty = parseFloat(itemQuantityInput.value);
        if (itemStatusInput.value === 'Còn hàng' && (isNaN(qty) || qty === 0)) {
          itemQuantityInput.value = '10'; // Gợi ý số lượng nếu chọn Còn hàng
        } else if (itemStatusInput.value === 'Hết hàng') {
          // Optionally set quantity to 0 if desired
        }
      }

      function updateImagePreview() {
        const url = itemImageInput.value.trim();
        if (url) {
          formImagePreview.src = url;
        } else {
          formImagePreview.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150';
        }
      }

      function openModal(item = null) {
        clearFormErrors();
        if (item) {
          // EDIT MODE
          currentEditingId = item.id;
          modalTitleText.textContent = `Chỉnh Sửa Món: ${item.name}`;
          saveItemBtn.textContent = 'Cập Nhật Món';

          itemIdInput.value = item.id;
          itemIdInput.disabled = true; // Lock ID when editing for safety
          itemNameInput.value = item.name;
          itemCategoryInput.value = item.category;
          itemPriceInput.value = item.price;
          itemQuantityInput.value = item.quantity;
          itemStatusInput.value = item.status;
          itemImageInput.value = item.image || '';
        } else {
          // ADD NEW MODE
          currentEditingId = null;
          modalTitleText.textContent = 'Thêm Món Mới Vào Thực Đơn';
          saveItemBtn.textContent = 'Thêm Món Mới';

          itemIdInput.disabled = false;
          itemForm.reset();

          // Auto-suggest next ID based on category
          suggestNextId();
          itemPriceInput.value = '';
          itemQuantityInput.value = '20';
          itemStatusInput.value = 'Còn hàng';
          itemImageInput.value = '';
        }

        updateImagePreview();
        itemModal.classList.add('active');
        itemNameInput.focus();
      }

      function suggestNextId() {
        const cat = itemCategoryInput.value;
        let prefix = 'CF';
        if (cat === 'Trà') prefix = 'TR';
        if (cat === 'Bánh ngọt') prefix = 'BN';

        let maxNum = 0;
        menuItems.forEach(item => {
          if (item.id && item.id.startsWith(prefix)) {
            const num = parseInt(item.id.replace(prefix, ''), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        });

        itemIdInput.value = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
      }

      function closeModal() {
        itemModal.classList.remove('active');
        clearFormErrors();
        currentEditingId = null;
      }

      function saveItem() {
        if (!validateFormData()) {
          showToast('Dữ liệu chưa hợp lệ', 'Vui lòng kiểm tra lại các trường báo lỗi màu đỏ', 'error');
          return;
        }

        const id = itemIdInput.value.trim().toUpperCase();
        const name = itemNameInput.value.trim();
        const category = itemCategoryInput.value;
        const price = Math.round(parseFloat(itemPriceInput.value));
        const quantity = Math.round(parseFloat(itemQuantityInput.value));
        let status = itemStatusInput.value;

        // Đồng bộ chặt: quantity = 0 → Hết hàng; quantity > 0 → Còn hàng; Hết hàng → quantity = 0
        if (status === 'Hết hàng') {
          // Nếu chọn Hết hàng, đưa quantity về 0
          // (nhưng chỉ khi người dùng thực sự chọn Hết hàng chủ động)
          // Ta vẫn giữ quantity theo input, chỉ ép status
        }
        if (quantity === 0) {
          status = 'Hết hàng';
        } else if (quantity > 0) {
          status = 'Còn hàng';
        }

        let imageUrl = itemImageInput.value.trim();
        if (!imageUrl) {
          // Provide a pleasant fallback based on category
          if (category === 'Cà phê') {
            imageUrl = 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400';
          } else if (category === 'Trà') {
            imageUrl = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400';
          } else {
            imageUrl = 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400';
          }
        }

        if (currentEditingId) {
          // UPDATE
          const index = menuItems.findIndex(i => i.id === currentEditingId);
          if (index !== -1) {
            menuItems[index] = {
              ...menuItems[index],
              name,
              category,
              price,
              quantity,
              status,
              image: imageUrl
            };
            saveItemsToStorage();
            calculateAndRenderStats();
            renderTable();
            closeModal();
            showToast('Cập nhật thành công', `Đã lưu thay đổi cho món "${name}"`, 'success');
          }
        } else {
          // ADD NEW
          const newItem = {
            id,
            name,
            category,
            price,
            quantity,
            status,
            image: imageUrl
          };
          menuItems.unshift(newItem); // Put at top
          saveItemsToStorage();
          calculateAndRenderStats();
          renderTable();
          closeModal();
          showToast('Thêm món thành công', `Đã thêm "${name}" (${id}) vào thực đơn`, 'success');
        }
      }

      /* ------------------------------------------------------------------------
         10b. QUICK QUANTITY ADJUST (+ / - IN TABLE)
         ------------------------------------------------------------------------ */
      function adjustQuantity(id, delta) {
        const index = menuItems.findIndex(i => i.id === id);
        if (index === -1) return;

        const item = menuItems[index];
        const newQty = Math.max(0, (Number(item.quantity) || 0) + delta);
        const newStatus = newQty === 0 ? 'Hết hàng' : 'Còn hàng';

        menuItems[index] = { ...item, quantity: newQty, status: newStatus };
        saveItemsToStorage();
        calculateAndRenderStats();
        renderTable();

        const changeWord = delta > 0 ? 'Tăng' : 'Giảm';
        const toastType = newQty === 0 ? 'warning' : 'success';
        showToast(
          `${changeWord} tồn kho`,
          `"${item.name}": ${Number(item.quantity)} → ${newQty} phần${newQty === 0 ? ' (Hết hàng)' : ''}`,
          toastType
        );
      }

      /* ------------------------------------------------------------------------
         10c. VIEW DETAIL MODAL
         ------------------------------------------------------------------------ */
      function openViewModal(item) {
        const viewModal = document.getElementById('viewModal');
        if (!viewModal) return;

        const safeImg = sanitizeUrl(item.image);
        const itemValue = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        const isOut = item.status === 'Hết hàng' || item.quantity === 0;

        let catClass = 'cafe';
        if (item.category === 'Trà') catClass = 'tra';
        if (item.category === 'Bánh ngọt') catClass = 'banh';

        document.getElementById('viewImg').src = safeImg;
        document.getElementById('viewImg').alt = item.name;
        document.getElementById('viewName').textContent = item.name;
        document.getElementById('viewId').textContent = item.id;
        document.getElementById('viewCategory').textContent = item.category;
        document.getElementById('viewCategory').className = `category-badge ${catClass}`;
        document.getElementById('viewPrice').textContent = formatVND(item.price);
        document.getElementById('viewQuantity').textContent = `${item.quantity} phần`;
        document.getElementById('viewQuantity').className = item.quantity === 0 ? 'quantity-zero' : (item.quantity <= 5 ? 'quantity-low' : '');
        document.getElementById('viewStatus').textContent = isOut ? 'Hết hàng' : 'Còn hàng';
        document.getElementById('viewStatus').className = `status-badge ${isOut ? 'status-out-stock' : 'status-in-stock'}`;
        document.getElementById('viewTotalValue').textContent = formatVND(itemValue);

        // Quick-edit button in view modal
        const editFromViewBtn = document.getElementById('editFromViewBtn');
        if (editFromViewBtn) {
          editFromViewBtn.onclick = () => {
            viewModal.classList.remove('active');
            openModal(item);
          };
        }

        viewModal.classList.add('active');
      }

      /* ------------------------------------------------------------------------
         11. DELETE LOGIC & CONFIRMATION MODAL
         ------------------------------------------------------------------------ */
      function openDeleteModal(id) {
        const item = menuItems.find(i => i.id === id);
        if (!item) return;

        currentDeletingId = id;
        deleteItemName.textContent = `"${item.name}" (${item.id})`;
        deleteModal.classList.add('active');
      }

      function closeDeleteModal() {
        deleteModal.classList.remove('active');
        currentDeletingId = null;
      }

      function executeDelete() {
        if (!currentDeletingId) return;

        const item = menuItems.find(i => i.id === currentDeletingId);
        const itemName = item ? item.name : currentDeletingId;

        menuItems = menuItems.filter(i => i.id !== currentDeletingId);
        saveItemsToStorage();
        calculateAndRenderStats();
        renderTable();
        closeDeleteModal();

        showToast('Đã xóa món', `Đã xóa thành công món "${itemName}" khỏi thực đơn`, 'success');
      }

      /* ------------------------------------------------------------------------
         12. RESET TO DEFAULT DATA
         ------------------------------------------------------------------------ */
      function openResetModal() {
        resetConfirmModal.classList.add('active');
      }

      function closeResetModal() {
        resetConfirmModal.classList.remove('active');
      }

      function executeReset() {
        menuItems = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_ITEMS));
        saveItemsToStorage();

        // Reset filter controls
        filterState.search = '';
        filterState.category = 'ALL';
        filterState.status = 'ALL';
        filterState.sort = 'default';

        searchInput.value = '';
        categoryFilter.value = 'ALL';
        statusFilter.value = 'ALL';
        sortSelect.value = 'default';
        clearSearchBtn.style.display = 'none';

        calculateAndRenderStats();
        renderTable();
        closeResetModal();

        showToast('Khôi phục thành công', 'Đã đặt lại 6 món cà phê & bánh mẫu từ đầu', 'info');
      }

      /* ------------------------------------------------------------------------
         13. EXPORT MENU TO CSV (EXCEL FRIENDLY WITH UTF-8 BOM)
         ------------------------------------------------------------------------ */
      function exportMenuToCSV() {
        if (!menuItems || menuItems.length === 0) {
          showToast('Danh sách trống', 'Không có món nào trong thực đơn để xuất file', 'warning');
          return;
        }

        const headers = ['Mã Món', 'Tên Món', 'Danh Mục', 'Giá Bán (VNĐ)', 'Số Lượng Tồn', 'Trạng Thái', 'Link Hình Ảnh'];
        const csvRows = [];

        // Add headers
        csvRows.push(headers.join(','));

        // Add data rows
        menuItems.forEach(item => {
          const row = [
            `"${(item.id || '').replace(/"/g, '""')}"`,
            `"${(item.name || '').replace(/"/g, '""')}"`,
            `"${(item.category || '').replace(/"/g, '""')}"`,
            item.price || 0,
            item.quantity || 0,
            `"${(item.status || '').replace(/"/g, '""')}"`,
            `"${(item.image || '').replace(/"/g, '""')}"`
          ];
          csvRows.push(row.join(','));
        });

        // Add BOM \uFEFF so Excel opens Vietnamese characters perfectly without garbled text
        const csvContent = '\uFEFF' + csvRows.join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const fileName = `tulo-coffee-thuc-don-${dateStr}.csv`;

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Xuất file thành công', `Đã tải về tệp "${fileName}" cho Excel`, 'success');
      }

      /* ------------------------------------------------------------------------
         14. TOAST NOTIFICATION SYSTEM
         ------------------------------------------------------------------------ */
      function showToast(title, message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-card ${type}`;

        let iconSvg = '';
        if (type === 'success') {
          iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
        } else if (type === 'error') {
          iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
        } else if (type === 'warning') {
          iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
        } else {
          iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
        }

        toast.innerHTML = `
          <div class="toast-icon">${iconSvg}</div>
          <div class="toast-content">
            <div class="toast-title">${escapeHtml(title)}</div>
            <div class="toast-desc">${escapeHtml(message)}</div>
          </div>
          <button class="toast-close" title="Đóng">&times;</button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
          removeToast(toast);
        });

        toastContainer.appendChild(toast);

        // Auto remove after 3.5s
        const autoDismissTimer = setTimeout(() => {
          removeToast(toast);
        }, 3500);

        toast._timer = autoDismissTimer;
      }

      function removeToast(toast) {
        if (!toast || toast.classList.contains('removing')) return;
        clearTimeout(toast._timer);
        toast.classList.add('removing');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 250);
      }

      /* ------------------------------------------------------------------------
         15. EVENT LISTENERS SETUP
         ------------------------------------------------------------------------ */
      function setupEventListeners() {
        // Theme Toggle
        themeToggleBtn.addEventListener('click', toggleTheme);

        // Open Add Modal
        openAddModalBtn.addEventListener('click', () => openModal(null));

        // Close Add/Edit Modal
        closeModalBtn.addEventListener('click', closeModal);
        cancelModalBtn.addEventListener('click', closeModal);

        // Save Form
        saveItemBtn.addEventListener('click', saveItem);
        itemForm.addEventListener('submit', e => {
          e.preventDefault();
          saveItem();
        });

        // Live input validation & status sync
        itemQuantityInput.addEventListener('input', handleQuantityChange);
        itemStatusInput.addEventListener('change', handleStatusChange);
        itemCategoryInput.addEventListener('change', () => {
          if (!currentEditingId) suggestNextId();
        });
        itemImageInput.addEventListener('input', updateImagePreview);

        // Search Input (Realtime)
        searchInput.addEventListener('input', e => {
          filterState.search = e.target.value;
          clearSearchBtn.style.display = e.target.value ? 'block' : 'none';
          renderTable();
        });

        clearSearchBtn.addEventListener('click', () => {
          searchInput.value = '';
          filterState.search = '';
          clearSearchBtn.style.display = 'none';
          searchInput.focus();
          renderTable();
        });

        // Category Filter
        categoryFilter.addEventListener('change', e => {
          filterState.category = e.target.value;
          renderTable();
        });

        // Status Filter
        statusFilter.addEventListener('change', e => {
          filterState.status = e.target.value;
          renderTable();
        });

        // Sort Select
        sortSelect.addEventListener('change', e => {
          filterState.sort = e.target.value;
          renderTable();
        });

        // Reset Filters Button
        const resetFiltersHandler = () => {
          filterState.search = '';
          filterState.category = 'ALL';
          filterState.status = 'ALL';
          filterState.sort = 'default';

          searchInput.value = '';
          categoryFilter.value = 'ALL';
          statusFilter.value = 'ALL';
          sortSelect.value = 'default';
          clearSearchBtn.style.display = 'none';

          renderTable();
          showToast('Đã xóa bộ lọc', 'Hiển thị toàn bộ danh sách thực đơn', 'info');
        };

        resetFiltersBtn.addEventListener('click', resetFiltersHandler);
        emptyResetBtn.addEventListener('click', resetFiltersHandler);

        // Delegate Table Actions: view, edit, delete, qty-inc, qty-dec
        menuTableBody.addEventListener('click', e => {
          const actionBtn = e.target.closest('[data-action]');
          if (!actionBtn) return;

          const action = actionBtn.getAttribute('data-action');
          const id = actionBtn.getAttribute('data-id');

          if (action === 'view') {
            const item = menuItems.find(i => i.id === id);
            if (item) openViewModal(item);
          } else if (action === 'edit') {
            const item = menuItems.find(i => i.id === id);
            if (item) openModal(item);
          } else if (action === 'delete') {
            openDeleteModal(id);
          } else if (action === 'qty-inc') {
            adjustQuantity(id, 1);
          } else if (action === 'qty-dec') {
            adjustQuantity(id, -1);
          }
        });

        // Delete Modal Buttons
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        confirmDeleteBtn.addEventListener('click', executeDelete);

        // Reset Data Buttons
        resetDataBtn.addEventListener('click', openResetModal);
        cancelResetBtn.addEventListener('click', closeResetModal);
        confirmResetBtn.addEventListener('click', executeReset);

        // Export CSV
        exportCsvBtn.addEventListener('click', exportMenuToCSV);

        // Close Modals on Backdrop Click
        const viewModal = document.getElementById('viewModal');
        [itemModal, deleteModal, resetConfirmModal, viewModal].forEach(modalEl => {
          if (!modalEl) return;
          modalEl.addEventListener('click', e => {
            if (e.target === modalEl) {
              modalEl.classList.remove('active');
            }
          });
        });

        // View Modal Close Button
        const closeViewModalBtn = document.getElementById('closeViewModalBtn');
        if (closeViewModalBtn) {
          closeViewModalBtn.addEventListener('click', () => {
            if (viewModal) viewModal.classList.remove('active');
          });
        }

        // Keyboard Shortcut: ESC to Close Any Active Modal
        document.addEventListener('keydown', e => {
          if (e.key === 'Escape') {
            closeModal();
            closeDeleteModal();
            closeResetModal();
            const vm = document.getElementById('viewModal');
            if (vm) vm.classList.remove('active');
          }
        });
      }

      /* ------------------------------------------------------------------------
         16. APP BOOTSTRAP
         ------------------------------------------------------------------------ */
      function initApp() {
        initTheme();
        loadItemsFromStorage();
        calculateAndRenderStats();
        renderTable();
        setupEventListeners();
      }

      // Run on DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
      } else {
        initApp();
      }

    })();
