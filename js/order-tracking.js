/**
 * ==========================================================================
 * TULO COFFEE - KHÁCH THEO DÕI ĐƠN HÀNG
 *  - Màn hình theo dõi: tiến trình từng bước (timeline), tự cập nhật mỗi 8 giây
 *  - Danh sách "Đơn của tôi": đơn đang xử lý lên đầu, có thanh tiến trình
 *  - Báo cho khách ngay khi quán duyệt / pha chế / sẵn sàng / từ chối đơn
 * Nạp SAU api.js và app.js. Ghi đè viewOrderDetails & loadMyOrdersTab của api.js.
 * Giờ hiển thị tính từ "số giây trước" do server gửi => không lệch múi giờ.
 * ==========================================================================
 */
(function () {
  'use strict';

  var FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
  var INFO = {
    pending: { label: 'Chờ duyệt', emoji: '⏳', hint: 'Đơn đã gửi tới quán, đang chờ quán xác nhận.' },
    confirmed: { label: 'Đã duyệt', emoji: '✅', hint: 'Quán đã nhận đơn và sắp bắt tay vào pha chế.' },
    preparing: { label: 'Đang pha chế', emoji: '🧋', hint: 'Barista đang pha đồ uống cho bạn.' },
    ready: { label: 'Sẵn sàng', emoji: '🔔', hint: 'Đồ uống đã xong! Vui lòng nhận tại quầy.' },
    completed: { label: 'Hoàn thành', emoji: '🎉', hint: 'Cảm ơn bạn đã ủng hộ Tulo Coffee!' },
    cancelled: { label: 'Đã hủy', emoji: '✖️', hint: 'Đơn đã bị hủy.' }
  };

  window.TuloOrderStatus = { FLOW: FLOW, INFO: INFO };

  function esc(s) {
    if (typeof escapeHtml === 'function') return escapeHtml(s);
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    return typeof formatCurrency === 'function' ? formatCurrency(n) : Number(n || 0).toLocaleString('vi-VN') + ' ₫';
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  /** Thời điểm sự kiện: ưu tiên "giây trước" (server tính), không có thì dùng chuỗi ngày */
  function when(secondsAgo, iso) {
    if (typeof secondsAgo === 'number' && isFinite(secondsAgo)) return new Date(Date.now() - secondsAgo * 1000);
    return iso ? new Date(iso) : null;
  }
  function fmtTime(d) {
    if (!d || isNaN(d.getTime())) return '';
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
  }
  function ago(d) {
    if (!d || isNaN(d.getTime())) return '';
    var s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
    if (s < 60) return 'vừa xong';
    if (s < 3600) return Math.floor(s / 60) + ' phút trước';
    if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
    return fmtTime(d);
  }
  window.TuloOrderStatus.when = when;
  window.TuloOrderStatus.fmtTime = fmtTime;
  window.TuloOrderStatus.ago = ago;

  function safeUser() { try { return typeof getAuthUser === 'function' ? getAuthUser() : null; } catch (e) { return null; } }
  function loggedIn() { var t = ''; try { t = getAuthToken(); } catch (e) { /* bỏ qua */ } return !!(t && safeUser()); }
  function isCustomer() { var u = safeUser(); return loggedIn() && u && u.role !== 'admin'; }
  function toast(msg, type) { if (typeof showToast === 'function') showToast(msg, type || 'info'); }

  function chip(status) {
    var i = INFO[status] || { label: status };
    return '<span class="ord-chip st-' + esc(status) + '">' + esc(i.label) + '</span>';
  }

  /* ======================= TIMELINE ======================= */
  function renderSteps(order) {
    var hist = order.history || [];
    var at = {};
    hist.forEach(function (h) { if (!at[h.Status]) at[h.Status] = h; });
    var cancelled = order.Status === 'cancelled';

    var html = FLOW.map(function (st, idx) {
      var h = at[st];
      var done = !!h;
      var current = order.Status === st;
      var cls = done ? 'done' : 'todo';
      if (current) cls += ' current';
      var sub = h ? fmtTime(when(h.SecondsAgo, h.CreatedAt)) : '';
      return '<li class="trk-step ' + cls + '"><span class="trk-dot">' + (done ? '✓' : idx + 1) + '</span><div><div class="t">' +
        esc(INFO[st].label) + '</div>' + (sub ? '<div class="s">' + esc(sub) + '</div>' : '') + '</div></li>';
    });

    if (cancelled) {
      // Chỉ giữ những bước đã đi qua, rồi thêm bước "Đã hủy"
      html = html.filter(function (_, i) { return !!at[FLOW[i]]; });
      var ch = at.cancelled || {};
      var reason = order.CancelReason || ch.Note || '';
      html.push('<li class="trk-step bad current"><span class="trk-dot">✕</span><div><div class="t">Đã hủy</div>' +
        '<div class="s">' + esc(fmtTime(when(ch.SecondsAgo, ch.CreatedAt))) + '</div>' +
        (reason ? '<div class="s" style="color:#B3261E;">Lý do: ' + esc(reason) + '</div>' : '') + '</div></li>');
    }
    return '<ol class="trk-steps">' + html.join('') + '</ol>';
  }

  function miniBar(status) {
    var idx = FLOW.indexOf(status);
    var cancelled = status === 'cancelled';
    var on = cancelled ? 1 : idx + 1;
    return '<div class="ord-mini' + (cancelled ? ' is-cancelled' : '') + '">' +
      FLOW.map(function (_, i) { return '<i class="' + (i < on ? 'on' : '') + '"></i>'; }).join('') + '</div>';
  }

  /* ======================= MÀN HÌNH THEO DÕI ======================= */
  var trk = { overlay: null, sheet: null, timer: null, orderId: null, lastStatus: null };

  function ensureSheet() {
    if (trk.overlay) return;
    var o = document.createElement('div');
    o.className = 'trk-overlay';
    o.innerHTML = '<div class="trk-sheet" role="dialog" aria-modal="true" aria-label="Theo dõi đơn hàng"></div>';
    document.body.appendChild(o);
    trk.overlay = o;
    trk.sheet = o.firstChild;
    o.addEventListener('click', function (e) { if (e.target === o) closeTracking(); });
  }

  function closeTracking() {
    if (!trk.overlay) return;
    trk.overlay.classList.remove('active');
    clearInterval(trk.timer);
    trk.timer = null;
    trk.orderId = null;
  }

  function renderTracking(o) {
    var info = INFO[o.Status] || { label: o.Status, emoji: '📦', hint: '' };
    var canCancel = o.Status === 'pending' && isCustomer();
    var reasonLine = o.Status === 'cancelled' && o.CancelReason ? '<div class="hint" style="color:#B3261E;">Lý do: ' + esc(o.CancelReason) + '</div>' : '';

    trk.sheet.innerHTML =
      '<div class="trk-head"><h3>Đơn ' + esc(o.OrderCode) + '</h3><button type="button" class="trk-close" aria-label="Đóng">&times;</button></div>' +
      '<div class="trk-hero"><div class="emoji">' + info.emoji + '</div><div class="label">' + esc(info.label) + '</div>' +
      '<div class="hint">' + esc(info.hint) + '</div>' + reasonLine + '</div>' +
      (['completed', 'cancelled'].indexOf(o.Status) === -1 ? '<div class="trk-live">● Tự động cập nhật</div>' : '') +
      renderSteps(o) +
      '<div class="trk-sec">Món đã đặt</div><table class="trk-items"><tbody>' +
      (o.items || []).map(function (it) {
        return '<tr><td>' + esc(it.Quantity) + ' × ' + esc(it.ProductName) + '</td><td>' + money(it.Subtotal) + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div class="trk-sum"><span>Tổng cộng</span><span>' + money(o.TotalAmount) + '</span></div>' +
      '<div class="trk-sec">Thông tin</div>' +
      '<div style="font-size:0.9rem; line-height:1.6;">' + esc(o.CustomerName) + ' • ' + esc(o.CustomerPhone) +
      (o.Note ? '<br>Ghi chú: ' + esc(o.Note) : '') + '</div>' +
      (canCancel ? '<div class="ord-actions" style="margin-top:16px;"><button type="button" class="btn btn-danger trk-cancel">Hủy đơn</button></div>' +
        '<div class="ord-meta" style="text-align:center;">Chỉ hủy được khi quán chưa duyệt.</div>' : '');

    trk.sheet.querySelector('.trk-close').addEventListener('click', closeTracking);
    var cancelBtn = trk.sheet.querySelector('.trk-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        if (!confirm('Bạn có chắc muốn hủy đơn này?')) return;
        cancelBtn.disabled = true;
        apiRequest('/orders/' + o.Id + '/cancel', { method: 'PATCH' }).then(function () {
          toast('Đã hủy đơn hàng', 'info');
          refreshTracking(true);
          reloadMyOrders();
          checkActiveOrders(true);
        }).catch(function (err) {
          cancelBtn.disabled = false;
          toast(err.message, 'error');
          refreshTracking(true);
        });
      });
    }
  }

  function refreshTracking(silent) {
    if (!trk.orderId) return Promise.resolve();
    var id = trk.orderId;
    return apiRequest('/orders/' + id).then(function (res) {
      if (trk.orderId !== id) return;
      var o = res.data;
      if (trk.lastStatus && trk.lastStatus !== o.Status && !silent) {
        toast('Đơn ' + o.OrderCode + ': ' + (INFO[o.Status] || {}).label, o.Status === 'cancelled' ? 'error' : 'success');
        reloadMyOrders();
      }
      trk.lastStatus = o.Status;
      renderTracking(o);
      if (['completed', 'cancelled'].indexOf(o.Status) !== -1) {
        clearInterval(trk.timer);
        trk.timer = null;
      }
    }).catch(function (err) {
      if (trk.sheet && !trk.lastStatus) trk.sheet.innerHTML = '<p style="color:#D32F2F;padding:12px;">' + esc(err.message) + '</p>';
    });
  }

  window.openOrderTracking = function (orderId) {
    ensureSheet();
    clearInterval(trk.timer);
    trk.orderId = orderId;
    trk.lastStatus = null;
    trk.sheet.innerHTML = '<p style="text-align:center;padding:24px;">Đang tải đơn hàng...</p>';
    trk.overlay.classList.add('active');
    refreshTracking(true);
    trk.timer = setInterval(function () { if (!document.hidden) refreshTracking(false); }, 8000);
  };
  window.viewOrderDetails = window.openOrderTracking;

  /* ======================= DANH SÁCH "ĐƠN CỦA TÔI" ======================= */
  var listTimer = null;

  function renderOrderCard(o) {
    var created = when(o.CreatedSecondsAgo, o.CreatedAt);
    var active = ['pending', 'confirmed', 'preparing', 'ready'].indexOf(o.Status) !== -1;
    return '<div class="ord-card">' +
      '<div class="ord-row"><span class="ord-code">' + esc(o.OrderCode) + '</span>' + chip(o.Status) + '</div>' +
      '<div class="ord-meta">' + esc(ago(created)) + ' • ' + esc(o.ItemCount) + ' món</div>' +
      (o.ItemsSummary ? '<div class="ord-items">' + esc(o.ItemsSummary) + '</div>' : '') +
      (active || o.Status === 'cancelled' ? miniBar(o.Status) : '') +
      (o.Status === 'cancelled' && o.CancelReason ? '<div class="ord-reason">Lý do: ' + esc(o.CancelReason) + '</div>' : '') +
      '<div class="ord-row" style="margin-top:8px;"><span class="ord-total">' + money(o.TotalAmount) + '</span></div>' +
      '<div class="ord-actions">' +
      '<button type="button" class="btn ' + (active ? 'btn-primary' : 'btn-secondary') + ' btn-sm" data-track="' + Number(o.Id) + '">' + (active ? 'Theo dõi đơn' : 'Chi tiết') + '</button>' +
      (o.Status === 'pending' ? '<button type="button" class="btn btn-danger btn-sm" data-cancel="' + Number(o.Id) + '">Hủy đơn</button>' : '') +
      '</div></div>';
  }

  function loadMyOrders(showLoading) {
    var content = document.getElementById('myOrdersContent');
    if (!content) return Promise.resolve();
    if (showLoading) content.innerHTML = '<p class="ord-empty">Đang tải đơn hàng...</p>';

    return apiRequest('/orders/my-orders?limit=30').then(function (res) {
      var orders = res.data || [];
      if (!orders.length) {
        content.innerHTML = '<p class="ord-empty">Bạn chưa đặt đơn hàng nào.</p>';
        return;
      }
      var isActive = function (o) { return ['pending', 'confirmed', 'preparing', 'ready'].indexOf(o.Status) !== -1; };
      var sorted = orders.filter(isActive).concat(orders.filter(function (o) { return !isActive(o); }));
      var activeCount = orders.filter(isActive).length;
      content.innerHTML = (activeCount ? '<div class="trk-sec" style="margin-top:0;">Đang xử lý (' + activeCount + ')</div>' : '') +
        sorted.map(renderOrderCard).join('');
    }).catch(function (err) {
      content.innerHTML = '<p style="color:#D32F2F;">' + esc(err.message) + '</p>';
    });
  }

  function reloadMyOrders() {
    if (document.getElementById('myOrdersContent') && document.getElementById('myOrdersContent').offsetParent !== null) {
      loadMyOrders(false);
    }
  }

  // Ghi đè hàm cũ của api.js (api.js gọi loadMyOrdersTab() theo tên nên sẽ dùng bản mới)
  window.loadMyOrdersTab = function () {
    clearInterval(listTimer);
    listTimer = setInterval(function () {
      var el = document.getElementById('myOrdersContent');
      if (!el) return;
      if (el.offsetParent === null || document.hidden) return; // tab đang ẩn thì thôi
      loadMyOrders(false);
    }, 10000);
    return loadMyOrders(true);
  };

  window.cancelCustomerOrder = function (orderId) {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
    apiRequest('/orders/' + orderId + '/cancel', { method: 'PATCH' }).then(function () {
      toast('Đã hủy đơn hàng', 'info');
      loadMyOrders(false);
      checkActiveOrders(true);
    }).catch(function (err) { toast(err.message, 'error'); });
  };

  // Một chỗ lắng nghe bấm nút cho cả danh sách (không dùng onclick rải rác)
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-track],[data-cancel]') : null;
    if (!t) return;
    if (t.hasAttribute('data-track')) {
      window.openOrderTracking(Number(t.getAttribute('data-track')));
    } else if (t.hasAttribute('data-cancel')) {
      window.cancelCustomerOrder(Number(t.getAttribute('data-cancel')));
    }
  });

  /* ======================= BÁO ĐỘNG NỀN: ĐƠN ĐỔI TRẠNG THÁI ======================= */
  var SNAP_KEY = 'tulo_order_snapshot';
  var watchTimer = null;

  function readSnap() { try { return JSON.parse(sessionStorage.getItem(SNAP_KEY) || 'null'); } catch (e) { return null; } }
  function writeSnap(v) { try { sessionStorage.setItem(SNAP_KEY, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } }

  function setBadge(n) {
    var badges = document.querySelectorAll('.order-badge');
    for (var i = 0; i < badges.length; i++) {
      badges[i].textContent = n;
      badges[i].style.display = n > 0 ? '' : 'none';
    }
  }

  function checkActiveOrders(silent) {
    if (!isCustomer()) { setBadge(0); return Promise.resolve(); }
    var uid = (safeUser() || {}).id;
    return apiRequest('/orders/my-orders?limit=15').then(function (res) {
      var orders = res.data || [];
      var now = {};
      var active = 0;
      orders.forEach(function (o) {
        now[o.Id] = o.Status;
        if (['pending', 'confirmed', 'preparing', 'ready'].indexOf(o.Status) !== -1) active += 1;
      });
      setBadge(active);

      var prev = readSnap();
      if (prev && prev.uid === uid && !silent) {
        orders.forEach(function (o) {
          var before = prev.map[o.Id];
          if (before && before !== o.Status && !(trk.orderId === o.Id)) {
            var i = INFO[o.Status] || {};
            var msg = o.Status === 'cancelled'
              ? 'Đơn ' + o.OrderCode + ' đã bị hủy' + (o.CancelReason ? ': ' + o.CancelReason : '')
              : 'Đơn ' + o.OrderCode + ': ' + i.label + ' ' + (i.emoji || '');
            toast(msg, o.Status === 'cancelled' ? 'error' : 'success');
          }
        });
      }
      writeSnap({ uid: uid, map: now });
    }).catch(function () { /* mạng chập chờn: lần sau thử lại */ });
  }

  function startWatcher() {
    clearInterval(watchTimer);
    watchTimer = null;
    if (!isCustomer()) { setBadge(0); return; }
    checkActiveOrders(true);
    watchTimer = setInterval(function () { if (!document.hidden) checkActiveOrders(false); }, 15000);
  }

  // Đăng nhập/đăng xuất: chạy lại bộ theo dõi (bọc hook có sẵn, không làm mất hook cũ)
  var prevHook = window.onAuthChanged;
  window.onAuthChanged = function () {
    if (typeof prevHook === 'function') { try { prevHook.apply(this, arguments); } catch (e) { /* bỏ qua */ } }
    if (!loggedIn()) writeSnap(null);
    startWatcher();
  };

  // Vừa đặt đơn xong thì kiểm tra ngay để huy hiệu số đơn cập nhật
  window.TuloOrderStatus.refreshBadge = function () { return checkActiveOrders(true); };

  document.addEventListener('visibilitychange', function () { if (!document.hidden) checkActiveOrders(false); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startWatcher);
  else startWatcher();
})();
