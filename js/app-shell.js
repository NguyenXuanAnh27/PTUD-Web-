/**
 * ==========================================================================
 * TULO COFFEE - "APP SHELL" CHO ĐIỆN THOẠI
 * Thêm thanh menu dưới đáy, thanh giỏ hàng nổi và bảng tài khoản.
 * Chỉ tái sử dụng các hàm có sẵn (getCartData, openAuthModal, openMyOrdersModal...),
 * không sửa logic đặt hàng. CSS (css/app-mobile.css) tự ẩn các phần này trên máy tính.
 * Nạp SAU api.js và app.js.
 * ==========================================================================
 */
(function () {
  'use strict';

  var NAV_ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"></path><path d="M5 10v10h14V10"></path><path d="M10 20v-6h4v6"></path></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>',
    cart: '<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"></path></svg>',
    user: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
  };

  function isAdminPage() {
    return window.location.pathname.toLowerCase().indexOf('quanly.html') !== -1;
  }

  function isMenuPage() {
    return window.location.pathname.toLowerCase().indexOf('menu.html') !== -1;
  }

  function money(n) {
    return typeof formatCurrency === 'function'
      ? formatCurrency(n)
      : Number(n || 0).toLocaleString('vi-VN') + ' ₫';
  }

  function safeCart() {
    try {
      return typeof getCartData === 'function' ? getCartData() : [];
    } catch (e) {
      return [];
    }
  }

  /* ----- Mở giỏ hàng: bấm vào nút giỏ có sẵn trên header (đã gắn sẵn sự kiện) ----- */
  function openCart() {
    var trigger = document.querySelector('.cart-trigger-btn');
    if (trigger) trigger.click();
  }

  /* ----- Bảng tài khoản ----- */
  function buildAccountSheet() {
    var overlay = document.createElement('div');
    overlay.className = 'app-sheet-overlay';
    var sheet = document.createElement('div');
    sheet.className = 'app-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-label', 'Tài khoản');
    document.body.appendChild(overlay);
    document.body.appendChild(sheet);

    function close() {
      sheet.classList.remove('active');
      overlay.classList.remove('active');
    }

    overlay.addEventListener('click', close);

    return {
      open: function (user) {
        // Dùng textContent để dữ liệu người dùng không bị hiểu thành HTML
        sheet.textContent = '';

        var who = document.createElement('div');
        who.className = 'app-sheet-who';
        who.textContent = user.fullName || user.username || 'Tài khoản';
        var small = document.createElement('small');
        small.textContent = user.email || '';
        who.appendChild(small);
        sheet.appendChild(who);

        var ordersBtn = document.createElement('button');
        ordersBtn.type = 'button';
        ordersBtn.className = 'btn btn-primary';
        ordersBtn.textContent = 'Đơn hàng & hồ sơ của tôi';
        ordersBtn.addEventListener('click', function () {
          close();
          if (typeof openMyOrdersModal === 'function') openMyOrdersModal();
        });
        sheet.appendChild(ordersBtn);

        var logoutBtn = document.createElement('button');
        logoutBtn.type = 'button';
        logoutBtn.className = 'btn btn-outline';
        logoutBtn.textContent = 'Đăng xuất';
        logoutBtn.addEventListener('click', function () {
          close();
          // Dùng đúng nút đăng xuất có sẵn để giữ nguyên logic thu hồi token
          var real = document.getElementById('logoutBtn');
          if (real) real.click();
        });
        sheet.appendChild(logoutBtn);

        overlay.classList.add('active');
        sheet.classList.add('active');
      }
    };
  }

  function init() {
    if (isAdminPage()) return; // trang quản trị giữ nguyên

    var cartCount = 0;

    /* ----- Thanh menu dưới đáy ----- */
    var nav = document.createElement('nav');
    nav.className = 'app-bottom-nav';
    nav.setAttribute('aria-label', 'Điều hướng chính');

    var onMenu = isMenuPage();
    var onHome = !onMenu;

    function link(href, icon, label, active) {
      var a = document.createElement('a');
      a.className = 'app-nav-item' + (active ? ' active' : '');
      a.href = href;
      a.innerHTML = icon + '<span>' + label + '</span>';
      return a;
    }

    function button(icon, label, withBadge) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'app-nav-item';
      b.innerHTML = icon + '<span>' + label + '</span>' + (withBadge ? '<span class="cart-badge" style="display:none;">0</span>' : '');
      return b;
    }

    var accountSheet = buildAccountSheet();

    var homeLink = link('index.html', NAV_ICONS.home, 'Trang chủ', onHome);
    var menuLink = link('menu.html', NAV_ICONS.menu, 'Thực đơn', onMenu);
    var cartBtn = button(NAV_ICONS.cart, 'Giỏ hàng', true);
    var userBtn = button(NAV_ICONS.user, 'Tài khoản', false);

    cartBtn.addEventListener('click', openCart);
    userBtn.addEventListener('click', function () {
      var user = typeof getAuthUser === 'function' ? getAuthUser() : null;
      var token = typeof getAuthToken === 'function' ? getAuthToken() : '';
      if (user && token) {
        accountSheet.open(user);
      } else if (typeof openAuthModal === 'function') {
        openAuthModal();
      }
    });

    nav.appendChild(homeLink);
    nav.appendChild(menuLink);
    nav.appendChild(cartBtn);
    nav.appendChild(userBtn);
    document.body.appendChild(nav);

    /* ----- Thanh giỏ hàng nổi ----- */
    var bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'app-cart-bar';
    bar.innerHTML = '<span><span class="app-cart-count">0</span>&nbsp; Xem giỏ hàng</span><span class="app-cart-total">0 ₫</span>';
    bar.addEventListener('click', openCart);
    document.body.appendChild(bar);

    var barCount = bar.querySelector('.app-cart-count');
    var barTotal = bar.querySelector('.app-cart-total');

    function refresh() {
      var cart = safeCart();
      cartCount = cart.reduce(function (s, it) { return s + (it.quantity || 0); }, 0);
      var total = cart.reduce(function (s, it) { return s + (it.price || 0) * (it.quantity || 0); }, 0);
      barCount.textContent = cartCount;
      barTotal.textContent = money(total);
      bar.classList.toggle('show', cartCount > 0);
    }

    /* Mỗi khi app.js cập nhật huy hiệu giỏ hàng, cập nhật luôn thanh giỏ nổi */
    if (typeof window.updateCartBadge === 'function') {
      var original = window.updateCartBadge;
      window.updateCartBadge = function () {
        original.apply(this, arguments);
        refresh();
      };
    }

    // Huy hiệu .cart-badge trong thanh dưới đáy mới tạo: cập nhật ngay lần đầu
    if (typeof window.updateCartBadge === 'function') {
      window.updateCartBadge();
    } else {
      refresh();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
