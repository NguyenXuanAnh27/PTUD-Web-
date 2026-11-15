/**
 * ==========================================================================
 * TULO COFFEE - BẢNG DUYỆT ĐƠN CHO CHỦ QUÁN (trang quanly.html)
 *  Chờ duyệt -> Đã duyệt -> Đang pha chế -> Sẵn sàng -> Hoàn thành  (hoặc Từ chối/Hủy kèm lý do)
 *  - Tab theo trạng thái, có số đơn; thẻ đơn có nút hành động đúng bước kế tiếp
 *  - Tự làm mới mỗi 10 giây, báo chuông + tiêu đề tab khi có đơn mới
 * Nạp SAU api.js và app.js. app.js gọi window.AdminOrderBoard.render().
 * ==========================================================================
 */
(function () {
  'use strict';

  var TABS = [
    { key: 'pending', label: 'Chờ duyệt' },
    { key: 'confirmed', label: 'Đã duyệt' },
    { key: 'preparing', label: 'Đang pha chế' },
    { key: 'ready', label: 'Sẵn sàng' },
    { key: 'completed', label: 'Hoàn thành' },
    { key: 'cancelled', label: 'Đã hủy' }
  ];

  // Mỗi trạng thái chỉ có đúng bước kế tiếp + nút hủy (khớp quy tắc ở backend)
  var ACTIONS = {
    pending: [{ to: 'confirmed', text: '✔ Duyệt đơn', cls: 'btn-primary' }, { to: 'cancelled', text: '✖ Từ chối', cls: 'btn-danger' }],
    confirmed: [{ to: 'preparing', text: 'Bắt đầu pha chế', cls: 'btn-primary' }, { to: 'cancelled', text: 'Hủy đơn', cls: 'btn-danger' }],
    preparing: [{ to: 'ready', text: 'Pha xong – Sẵn sàng', cls: 'btn-primary' }, { to: 'cancelled', text: 'Hủy đơn', cls: 'btn-danger' }],
    ready: [{ to: 'completed', text: 'Giao khách – Hoàn thành', cls: 'btn-primary' }, { to: 'cancelled', text: 'Hủy đơn', cls: 'btn-danger' }]
  };

  var REASONS = ['Hết nguyên liệu', 'Món tạm hết', 'Quán sắp đóng cửa', 'Không liên lạc được khách', 'Đơn trùng'];

  var SOUND_KEY = 'tulo_admin_sound';
  var state = { tab: 'pending', counts: {}, orders: [], lastPendingId: null, timer: null, busy: false, newIds: {}, baseTitle: document.title };

  function esc(s) {
    if (typeof escapeHtml === 'function') return escapeHtml(s);
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return typeof formatCurrency === 'function' ? formatCurrency(n) : Number(n || 0).toLocaleString('vi-VN') + ' ₫'; }
  function toast(m, t) { if (typeof showToast === 'function') showToast(m, t || 'info'); }
  function root() { return document.getElementById('adminOrderBoard'); }
  function isAdmin() {
    try { var u = getAuthUser(); return !!(u && u.role === 'admin' && getAuthToken()); } catch (e) { return false; }
  }
  function soundOn() { try { return localStorage.getItem(SOUND_KEY) !== 'off'; } catch (e) { return true; } }
  function setSound(on) { try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch (e) { /* bỏ qua */ } }

  function beep() {
    if (!soundOn()) return;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      [880, 1175].forEach(function (f, i) {
        var o = ctx.createOscillator(); var g = ctx.createGain();
        o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.2);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.18);
        o.start(ctx.currentTime + i * 0.2); o.stop(ctx.currentTime + i * 0.2 + 0.2);
      });
      setTimeout(function () { try { ctx.close(); } catch (e) { /* bỏ qua */ } }, 800);
    } catch (e) { /* trình duyệt chặn âm thanh: bỏ qua */ }
  }

  function timeAgo(o) {
    var T = window.TuloOrderStatus;
    return T ? T.ago(T.when(o.CreatedSecondsAgo, o.CreatedAt)) : '';
  }

  /* ---------- Vẽ khung (một lần) và nội dung ---------- */
  function drawShell() {
    var el = root();
    if (!el || el.getAttribute('data-ready')) return;
    el.setAttribute('data-ready', '1');
    el.innerHTML =
      '<div class="ob-bar"><div class="ob-tools"><label style="display:flex;gap:6px;align-items:center;cursor:pointer;">' +
      '<input type="checkbox" id="obSound"> 🔔 Báo âm thanh khi có đơn mới</label></div>' +
      '<div class="ob-tabs" id="obTabs"></div></div><div id="obList" class="ob-grid"></div>';
    var cb = document.getElementById('obSound');
    cb.checked = soundOn();
    cb.addEventListener('change', function () { setSound(cb.checked); if (cb.checked) beep(); });

    el.addEventListener('click', function (e) {
      var tab = e.target.closest('[data-tab]');
      if (tab) { state.tab = tab.getAttribute('data-tab'); drawTabs(); loadOrders(); return; }
      var act = e.target.closest('[data-act]');
      if (act) handleAction(Number(act.getAttribute('data-id')), act.getAttribute('data-act'), act);
      var det = e.target.closest('[data-detail]');
      if (det && typeof window.viewOrderDetails === 'function') window.viewOrderDetails(Number(det.getAttribute('data-detail')));
    });
  }

  function drawTabs() {
    var box = document.getElementById('obTabs');
    if (!box) return;
    box.innerHTML = TABS.map(function (t) {
      var n = state.counts[t.key] || 0;
      var hot = t.key === 'pending' && n > 0;
      return '<button type="button" class="ob-tab' + (state.tab === t.key ? ' active' : '') + (hot ? ' has-new' : '') +
        '" data-tab="' + t.key + '">' + t.label + '<span class="n">' + n + '</span></button>';
    }).join('');
  }

  function drawList() {
    var box = document.getElementById('obList');
    if (!box) return;
    if (!state.orders.length) {
      box.innerHTML = '<div class="ord-empty" style="grid-column:1/-1;">Không có đơn nào ở mục này.</div>';
      return;
    }
    box.innerHTML = state.orders.map(function (o) {
      var acts = (ACTIONS[o.Status] || []).map(function (a) {
        return '<button type="button" class="btn ' + a.cls + ' btn-sm" data-act="' + a.to + '" data-id="' + Number(o.Id) + '">' + a.text + '</button>';
      }).join('');
      return '<div class="ord-card' + (state.newIds[o.Id] ? ' is-new' : '') + '">' +
        '<div class="ord-row"><span class="ord-code">' + esc(o.OrderCode) + '</span>' +
        '<span class="ord-chip st-' + esc(o.Status) + '">' + esc((window.TuloOrderStatus && window.TuloOrderStatus.INFO[o.Status] || {}).label || o.Status) + '</span></div>' +
        '<div class="ord-meta">' + esc(timeAgo(o)) + ' • ' + esc(o.CustomerName) + ' • ' + esc(o.CustomerPhone) + '</div>' +
        '<div class="ord-items">' + esc(o.ItemsSummary || (o.ItemCount + ' món')) + '</div>' +
        (o.Note ? '<div class="ord-note">📝 ' + esc(o.Note) + '</div>' : '') +
        (o.Status === 'cancelled' && o.CancelReason ? '<div class="ord-reason">Lý do: ' + esc(o.CancelReason) + '</div>' : '') +
        '<div class="ord-row" style="margin-top:6px;"><span class="ord-total">' + money(o.TotalAmount) + '</span>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-detail="' + Number(o.Id) + '">Chi tiết</button></div>' +
        (acts ? '<div class="ord-actions">' + acts + '</div>' : '') + '</div>';
    }).join('');
  }

  /* ---------- Gọi API ---------- */
  function loadRevenue() {
    var badge = document.getElementById('adminRevenueBadge');
    if (!badge) return Promise.resolve();
    return apiRequest('/statistics/overview').then(function (res) {
      if (res.data) badge.textContent = 'Doanh thu đơn hoàn thành: ' + money(res.data.TotalRevenue) + ' (' + res.data.TotalOrders + ' đơn)';
    }).catch(function () { /* không chặn bảng duyệt đơn */ });
  }

  function updateTitle() {
    var n = state.counts.pending || 0;
    document.title = (n > 0 ? '(' + n + ') ' : '') + state.baseTitle;
  }

  function loadSummary(isPoll) {
    return apiRequest('/orders/summary').then(function (res) {
      var d = res.data || {};
      state.counts = d.counts || {};
      var latest = d.latestPendingOrderId || 0;
      if (state.lastPendingId !== null && latest > state.lastPendingId) {
        state.newIds[latest] = true;
        toast('🔔 Có đơn mới chờ duyệt!', 'success');
        beep();
      }
      state.lastPendingId = Math.max(state.lastPendingId || 0, latest);
      drawTabs();
      updateTitle();
      return d;
    });
  }

  function loadOrders() {
    var list = document.getElementById('obList');
    if (list && !state.orders.length) list.innerHTML = '<div class="ord-empty" style="grid-column:1/-1;">Đang tải đơn...</div>';
    var limit = (state.tab === 'completed' || state.tab === 'cancelled') ? 30 : 50;
    return apiRequest('/orders?status=' + state.tab + '&limit=' + limit).then(function (res) {
      state.orders = res.data || [];
      drawList();
    }).catch(function (err) {
      if (list) list.innerHTML = '<p style="color:#D32F2F;grid-column:1/-1;">' + esc(err.message) + '</p>';
    });
  }

  function refreshAll(isPoll) {
    if (!isAdmin() || !root()) return Promise.resolve();
    return loadSummary(isPoll).then(loadOrders);
  }

  /* ---------- Hành động duyệt đơn ---------- */
  function askReason(title, onSubmit) {
    var ov = document.createElement('div');
    ov.className = 'ob-modal-overlay';
    ov.innerHTML = '<div class="ob-modal" role="dialog" aria-modal="true"><h4>' + esc(title) + '</h4>' +
      '<div class="ord-meta">Lý do sẽ hiển thị cho khách hàng.</div><div class="ob-chips">' +
      REASONS.map(function (r) { return '<button type="button" data-r="' + esc(r) + '">' + esc(r) + '</button>'; }).join('') +
      '</div><textarea maxlength="255" placeholder="Nhập lý do (tối thiểu 3 ký tự)"></textarea>' +
      '<div class="ord-actions"><button type="button" class="btn btn-secondary ob-no">Quay lại</button>' +
      '<button type="button" class="btn btn-danger ob-yes">Xác nhận</button></div></div>';
    document.body.appendChild(ov);
    var ta = ov.querySelector('textarea');
    ta.focus();
    function close() { ov.remove(); }
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.classList.contains('ob-no')) return close();
      var chipBtn = e.target.closest('[data-r]');
      if (chipBtn) ta.value = chipBtn.getAttribute('data-r');
      if (e.target.classList.contains('ob-yes')) {
        var v = ta.value.trim();
        if (v.length < 3) { toast('Vui lòng nhập lý do (ít nhất 3 ký tự)', 'error'); return; }
        close();
        onSubmit(v);
      }
    });
  }

  function sendStatus(id, status, reason, btn) {
    if (state.busy) return;
    state.busy = true;
    if (btn) btn.disabled = true;
    var body = { status: status };
    if (reason) body.reason = reason;
    apiRequest('/orders/' + id + '/status', { method: 'PATCH', body: JSON.stringify(body) }).then(function () {
      delete state.newIds[id];
      var label = (window.TuloOrderStatus && window.TuloOrderStatus.INFO[status] || {}).label || status;
      toast('Đã chuyển đơn sang "' + label + '"', 'success');
      document.dispatchEvent(new CustomEvent('tulo:orders-changed'));
    }).catch(function (err) {
      toast(err.message, 'error'); // gồm cả lỗi 409 "đơn vừa được cập nhật ở nơi khác"
    }).then(function () {
      state.busy = false;
      refreshAll(false);
      loadRevenue();
    });
  }

  function handleAction(id, to, btn) {
    if (to === 'cancelled') {
      askReason('Từ chối / hủy đơn này?', function (reason) { sendStatus(id, 'cancelled', reason, btn); });
    } else {
      sendStatus(id, to, null, btn);
    }
  }

  /* ---------- Điểm vào cho app.js ---------- */
  function render() {
    var el = root();
    if (!el) return Promise.resolve();
    clearInterval(state.timer);
    state.timer = null;

    if (!isAdmin()) {
      el.removeAttribute('data-ready');
      el.innerHTML = '<p class="ord-empty">Đăng nhập quyền Admin để duyệt đơn hàng.</p>';
      document.title = state.baseTitle;
      return Promise.resolve();
    }

    drawShell();
    drawTabs();
    state.lastPendingId = null; // lần đầu chỉ ghi nhận, không báo chuông cho đơn cũ
    return refreshAll(false).then(function () {
      loadRevenue();
      state.timer = setInterval(function () {
        if (document.hidden || !root()) return;
        refreshAll(true);
      }, 10000);
    });
  }

  window.AdminOrderBoard = { render: render, refresh: function () { return refreshAll(false); } };
})();
