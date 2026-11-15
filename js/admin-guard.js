/**
 * ==========================================================================
 * TULO COFFEE - CHỈ ADMIN MỚI THẤY KHU VỰC QUẢN TRỊ
 *  - Ẩn các liên kết "Quản Trị" với khách và người chưa đăng nhập
 *  - Trang quanly.html: khách đang đăng nhập bị đưa về trang chủ;
 *    người chưa đăng nhập chỉ thấy khung "đăng nhập quản trị", không thấy nội dung
 * Lưu ý: đây là lớp giao diện. Quyền thật vẫn do Backend kiểm tra (authorize('admin')).
 * Nạp NGAY SAU api.js, trước app.js.
 * ==========================================================================
 */
(function () {
  'use strict';

  function user() { try { return typeof getAuthUser === 'function' ? getAuthUser() : null; } catch (e) { return null; } }
  function token() { try { return typeof getAuthToken === 'function' ? getAuthToken() : ''; } catch (e) { return ''; } }
  function isAdmin() { var u = user(); return !!(u && u.role === 'admin' && token()); }
  function onAdminPage() { return window.location.pathname.toLowerCase().indexOf('quanly.html') !== -1; }

  var wasLocked = false;

  function buildGate() {
    if (document.getElementById('adminGate') || !document.body) return;
    var box = document.createElement('section');
    box.id = 'adminGate';
    box.className = 'section-padding';
    box.innerHTML =
      '<div class="container" style="max-width:480px; text-align:center;">' +
      '<div style="font-size:2.6rem;">🔐</div>' +
      '<h2 style="font-family:var(--font-heading); margin:8px 0;">Khu vực dành cho quản trị viên</h2>' +
      '<p style="color:var(--text-muted); margin-bottom:18px;">Vui lòng đăng nhập bằng tài khoản quản trị để tiếp tục.</p>' +
      '<div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">' +
      '<button type="button" class="btn btn-primary" id="adminGateLogin">Đăng nhập quản trị</button>' +
      '<a class="btn btn-outline" href="index.html">Về trang chủ</a></div></div>';
    var main = document.querySelector('main');
    if (main && main.parentNode) main.parentNode.insertBefore(box, main);
    else document.body.appendChild(box);
    document.getElementById('adminGateLogin').addEventListener('click', function () {
      if (typeof openAuthModal === 'function') openAuthModal();
    });
  }

  function apply() {
    var admin = isAdmin();
    document.documentElement.classList.toggle('is-admin', admin);
    if (!onAdminPage()) return;

    if (admin) {
      // Vừa đăng nhập admin từ khung khóa: tải lại để trang nạp dữ liệu quản trị
      if (wasLocked) { window.location.reload(); return; }
      document.documentElement.classList.remove('admin-locked');
      var g = document.getElementById('adminGate');
      if (g) g.remove();
      return;
    }

    if (user() && token()) { // khách hàng: không có quyền vào đây
      window.location.replace('index.html');
      return;
    }

    wasLocked = true;
    document.documentElement.classList.add('admin-locked');
    if (document.body) buildGate();
    else document.addEventListener('DOMContentLoaded', buildGate);
  }

  // Bọc hàm lưu/xóa phiên đăng nhập của api.js để cập nhật ngay khi đăng nhập/đăng xuất
  ['setAuthSession', 'clearAuthSession'].forEach(function (name) {
    var original = window[name];
    if (typeof original !== 'function') return;
    window[name] = function () {
      var result = original.apply(this, arguments);
      apply();
      return result;
    };
  });

  // Đăng nhập/đăng xuất ở tab khác
  window.addEventListener('storage', apply);

  apply();
})();
