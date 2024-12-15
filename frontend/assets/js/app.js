/**
 * Core Application Logic
 * API calls, authentication state, UI utilities, formatters
 * Updated for 3NF schema: UPPERCASE roles/status, name field
 */
const App = {
  config: {
    // Nếu đang chạy trên cổng của Backend (5000, 5001) thì dùng relative path.
    // Nếu chạy qua Live Server (port khác như 5500, 3000) thì ép cứng trỏ về Backend.
    apiUrl:
      window.location.port === "5000" || window.location.port === "5001"
        ? "/api"
        : "http://127.0.0.1:5000/api",
  },

  state: {
    user: null,
    token: null,
  },

  init() {
    this.loadAuthState();
    this.setupToastContainer();
    this.setupLoader();
    this.handleRoutingAccess();
    this.highlightActiveNav();
    this.renderUserInfo();
    this.setupMobileMenu();

    // Auto-render public headers if container exists
    if (document.getElementById("navLinks")) {
      this.renderPublicHeader("navLinks", true);
    } else if (document.getElementById("headerActions")) {
      this.renderPublicHeader("headerActions", false);
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  },

  getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return this.config.apiUrl.replace("/api", "") + path;
  },

  getAvatarUrl(path) {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return this.config.apiUrl.replace("/api", "") + path;
  },

  renderPublicHeader(containerId, isIndex = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const basePath = isIndex ? "pages" : "..";

    // ALWAYS use modern button styles for the public navbar
    const btnClassNormal = "btn-glass";
    const btnStyleNormal = "";
    const btnClassPrimary = "btn-gradient";

    if (!this.isLoggedIn()) {
      container.innerHTML = `
        <a href="${basePath}/guest/login.html" class="${btnClassNormal}">Đăng nhập</a>
        <a href="${basePath}/guest/register.html" class="${btnClassPrimary}">Đăng ký ngay</a>
      `;
      return;
    }

    const role = (this.state.user.role || "").toUpperCase();
    const rolePath = role.toLowerCase();

    let dropdownItems = "";
    if (role === "USER") {
      dropdownItems = `
        <a href="${basePath}/${rolePath}/dashboard.html"><i class="fas fa-chart-pie"></i> Dashboard</a>
        <a href="${basePath}/${rolePath}/requests.html"><i class="fas fa-paper-plane"></i> Yêu cầu thuê</a>
        <a href="${basePath}/${rolePath}/contracts.html"><i class="fas fa-file-signature"></i> Hợp đồng</a>
        <a href="${basePath}/${rolePath}/payments.html"><i class="fas fa-credit-card"></i> Thanh toán</a>
        <a href="${basePath}/guest/roommates.html"><i class="fas fa-user-friends"></i> Tìm bạn ở ghép</a>
      `;
    } else if (role === "OWNER") {
      dropdownItems = `
        <a href="${basePath}/${rolePath}/dashboard.html"><i class="fas fa-chart-pie"></i> Dashboard</a>
        <a href="${basePath}/${rolePath}/rooms.html"><i class="fas fa-bed"></i> Phòng của tôi</a>
        <a href="${basePath}/${rolePath}/requests.html"><i class="fas fa-envelope-open-text"></i> Yêu cầu thuê</a>
        <a href="${basePath}/${rolePath}/contracts.html"><i class="fas fa-file-signature"></i> Hợp đồng</a>
        <a href="${basePath}/${rolePath}/payments.html"><i class="fas fa-credit-card"></i> Thanh toán</a>
      `;
    } else {
      dropdownItems = `<a href="${basePath}/${rolePath}/dashboard.html"><i class="fas fa-chart-pie"></i> Dashboard</a>`;
    }

    container.innerHTML = `
      <style>
        #userDropdownMenu.show { display: flex !important; }
        #userDropdownMenu a { padding: 0.75rem 1rem; color: var(--text-main); text-decoration: none; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; transition: background 0.2s; }
        #userDropdownMenu a:hover { background: var(--surface-2); }
        #userDropdownMenu i { width: 16px; text-align: center; color: var(--text-muted); }
        #userDropdownMenu a[onclick] i { color: var(--danger); }
      </style>
      <div style="display:flex; align-items:center; gap: 1rem;">
        <a href="${basePath}/${rolePath}/notifications.html" class="${btnClassNormal}" ${btnStyleNormal}><i class="fas fa-bell"></i> Thông báo</a>
        
        <div class="user-dropdown-wrapper" style="position:relative; margin-left:0.5rem;">
          <button class="${btnClassPrimary}" style="border:none; display:flex; align-items:center; gap:0.5rem;" onclick="document.getElementById('userDropdownMenu').classList.toggle('show')">
            ${this.state.user.avatar_url ? `<img src="${this.getAvatarUrl(this.state.user.avatar_url)}" alt="avatar" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">` : '<i class="fas fa-user-circle"></i>'}
            ${this.state.user.name} <i class="fas fa-chevron-down" style="font-size:0.7em;"></i>
          </button>
          <div id="userDropdownMenu" class="dropdown-menu" style="position:absolute; top:120%; right:0; background:var(--surface); border-radius:var(--radius-md); box-shadow:var(--shadow-lg); width:220px; display:none; flex-direction:column; z-index:100; overflow:hidden; border:1px solid var(--border);">
            ${dropdownItems}
            <div style="height:1px; background:var(--border); margin:4px 0;"></div>
            <a href="#" onclick="App.logout()" style="color:var(--danger);"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
          </div>
        </div>
      </div>
    `;
    document.addEventListener("click", (e) => {
      const wrapper = document.querySelector(".user-dropdown-wrapper");
      const menu = document.getElementById("userDropdownMenu");
      if (wrapper && menu && !wrapper.contains(e.target)) {
        menu.classList.remove("show");
      }
    });
  },

  /* ── Auth State ── */
  loadAuthState() {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      try {
        this.state.token = token;
        this.state.user = JSON.parse(user);
      } catch (e) {
        this.logout();
      }
    }
  },

  isLoggedIn() {
    return !!this.state.token && !!this.state.user;
  },

  checkAuth(message = "Vui lòng đăng nhập để thực hiện chức năng này!") {
    if (this.isLoggedIn()) return true;
    this.showToast(message, "warning");
    return false;
  },

  /* ── Route Protection ── */
  handleRoutingAccess() {
    const path = window.location.pathname.toLowerCase();

    // Unprotected routes
    const publicRoutes = [
      "login.html",
      "register.html",
      "index.html",
      "rooms.html",
      "room-detail.html",
      "roommates.html",
      "pricing.html",
      "news.html",
    ];
    const isPublic =
      publicRoutes.some((r) => path.includes(r)) ||
      path === "/" ||
      path.endsWith("/");

    // If on guest pages, allow but don't redirect to login
    if (
      path.includes("/guest/rooms") ||
      path.includes("/guest/room-detail") ||
      path.includes("/guest/roommates") ||
      path.includes("/guest/pricing") ||
      path.includes("/guest/news")
    )
      return;

    if (path.includes("login.html") || path.includes("register.html")) {
      if (this.state.token) this.redirectBasedOnRole();
      return;
    }
    if (path === "/" || path.includes("index.html")) return;

    // Protected routes
    if (!this.state.token) {
      window.location.href = "/frontend/pages/guest/login.html";
      return;
    }

    // UPPERCASE role checks
    const role = (this.state.user?.role || "").toUpperCase();
    if (path.includes("/admin/") && role !== "ADMIN")
      this.redirectBasedOnRole();
    if (path.includes("/owner/") && role !== "OWNER")
      this.redirectBasedOnRole();
    if (path.includes("/user/") && role !== "USER") this.redirectBasedOnRole();
  },

  redirectBasedOnRole() {
    const role = (this.state.user?.role || "").toUpperCase();
    if (role === "ADMIN")
      window.location.href = "/frontend/pages/admin/dashboard.html";
    else if (role === "OWNER")
      window.location.href = "/frontend/pages/owner/dashboard.html";
    else window.location.href = "/frontend/pages/user/dashboard.html";
  },

  /* ── API Wrapper ── */
  async api(endpoint, method = "GET", data = null, isFormData = false) {
    this.showLoader();
    try {
      const headers = {};
      if (this.state.token) {
        headers["Authorization"] = `Bearer ${this.state.token}`;
      }
      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }

      const config = { method, headers };
      if (data) {
        config.body = isFormData ? data : JSON.stringify(data);
      }

      const response = await fetch(`${this.config.apiUrl}${endpoint}`, config);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401 && endpoint !== "/auth/login")
          this.logout();
        throw new Error(result.message || "Something went wrong");
      }

      return result;
    } catch (error) {
      this.showToast(error.message, "error");
      throw error;
    } finally {
      this.hideLoader();
    }
  },

  /* ── Formatters ── */
  formatCurrency(amount) {
    const num = parseFloat(amount);
    if (isNaN(num)) return "0\u00A0₫";
    return num.toLocaleString("vi-VN") + "\u00A0₫";
  },

  formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  },

  formatDateTime(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  timeAgo(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now - d;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    return this.formatDate(dateStr);
  },

  /* ── Status Badges — UPPERCASE keys matching DB ENUMs ── */
  statusBadge(status) {
    const map = {
      // Room status
      PENDING: { class: "badge-warning", label: "Chờ duyệt" },
      AVAILABLE: { class: "badge-success", label: "Còn trống" },
      RENTED: { class: "badge-info", label: "Đã cho thuê" },
      REJECTED: { class: "badge-danger", label: "Từ chối" },
      // Rental request status
      APPROVED: { class: "badge-success", label: "Đã duyệt" },
      // Contract status
      ACTIVE: { class: "badge-success", label: "Đang hoạt động" },
      COMPLETED: { class: "badge-info", label: "Hoàn thành" },
      CANCELLED: { class: "badge-secondary", label: "Đã hủy" },
      // Payment status
      PAID: { class: "badge-success", label: "Đã thanh toán" },
      FAILED: { class: "badge-danger", label: "Thất bại" },
      // Support status
      OPEN: { class: "badge-warning", label: "Mở" },
      IN_PROGRESS: { class: "badge-info", label: "Đang xử lý" },
      RESOLVED: { class: "badge-success", label: "Đã giải quyết" },
      // Roommate request
      ACCEPTED: { class: "badge-success", label: "Chấp nhận" },
      // Roommate match
      SUGGESTED: { class: "badge-info", label: "Gợi ý" },
      VIEWED: { class: "badge-warning", label: "Đã xem" },
      CONNECTED: { class: "badge-success", label: "Đã kết nối" },
      // User status
      BLOCKED: { class: "badge-danger", label: "Bị khóa" },
    };
    const s = (status || "").toUpperCase();
    const info = map[s] || { class: "badge-secondary", label: status || "N/A" };
    return `<span class="badge ${info.class}">${this.escapeHtml(info.label)}</span>`;
  },

  roleBadge(role) {
    const map = {
      USER: { class: "badge-info", label: "Người thuê" },
      OWNER: { class: "badge-primary", label: "Chủ trọ" },
      ADMIN: { class: "badge-danger", label: "Admin" },
    };
    const r = (role || "").toUpperCase();
    const info = map[r] || { class: "badge-secondary", label: role };
    return `<span class="badge ${info.class}">${this.escapeHtml(info.label)}</span>`;
  },

  /* ── Security: HTML Escaping ── */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  },

  /* ── Pagination ── */
  renderPagination(page, limit, total, onPageChange) {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return "";

    let html = '<div class="pagination">';
    html += `<button class="page-btn" onclick="${onPageChange}(${page - 1})" ${page <= 1 ? "disabled" : ""}><i class="fas fa-chevron-left"></i></button>`;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        html += `<button class="page-btn ${i === page ? "active" : ""}" onclick="${onPageChange}(${i})">${i}</button>`;
      } else if (i === page - 2 || i === page + 2) {
        html += `<span class="page-btn" style="border:none;cursor:default;">…</span>`;
      }
    }

    html += `<button class="page-btn" onclick="${onPageChange}(${page + 1})" ${page >= totalPages ? "disabled" : ""}><i class="fas fa-chevron-right"></i></button>`;
    html += "</div>";
    return html;
  },

  /* ── Modal ── */
  openModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove("active");
      document.body.style.overflow = "";
    }
  },

  /* ── Confirm Dialog ── */
  confirm(message, title = "Xác nhận") {
    return new Promise((resolve) => {
      let overlay = document.getElementById("appConfirmModal");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "appConfirmModal";
        overlay.className = "modal-overlay";
        overlay.innerHTML = `
          <div class="modal" style="max-width: 400px; padding: 0;">
            <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
              <div>
                <div class="modal-title" id="appConfirmTitle" style="font-size: 1.125rem;">Xác nhận</div>
              </div>
            </div>
            <div class="modal-body" id="appConfirmMessage" style="padding: 1rem 1.5rem 1.5rem; font-size: 0.95rem; color: var(--text-main); line-height: 1.5;"></div>
            <div class="modal-footer" style="background: var(--surface-2); border-top: 1px solid var(--border);">
              <button class="btn btn-secondary" id="appConfirmCancelBtn">Hủy</button>
              <button class="btn btn-primary" id="appConfirmOkBtn">Đồng ý</button>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
      }

      document.getElementById("appConfirmTitle").textContent = title;
      document.getElementById("appConfirmMessage").textContent = message;

      const btnOk = document.getElementById("appConfirmOkBtn");
      const btnCancel = document.getElementById("appConfirmCancelBtn");

      const cleanup = () => {
        overlay.classList.remove("active");
        btnOk.onclick = null;
        btnCancel.onclick = null;
      };

      btnOk.onclick = () => {
        cleanup();
        resolve(true);
      };
      btnCancel.onclick = () => {
        cleanup();
        resolve(false);
      };

      // Delay adding class to allow DOM insertion to trigger transition
      setTimeout(() => overlay.classList.add("active"), 10);
    });
  },

  /* ── Toast ── */
  setupToastContainer() {
    if (!document.getElementById("toast-container")) {
      const c = document.createElement("div");
      c.id = "toast-container";
      document.body.appendChild(c);
    }
  },

  showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
      success: "check-circle",
      error: "times-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    const icon = icons[type] || icons.info;

    toast.innerHTML = `
      <div class="toast-icon"><i class="fas fa-${icon}"></i></div>
      <div class="toast-content"><div class="toast-msg">${message}</div></div>
    `;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  },

  /* ── Loader ── */
  setupLoader() {
    if (!document.getElementById("app-loader")) {
      const loader = document.createElement("div");
      loader.id = "app-loader";
      loader.className = "loader-overlay";
      loader.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(loader);
    }
  },

  showLoader() {
    document.getElementById("app-loader")?.classList.add("active");
  },
  hideLoader() {
    document.getElementById("app-loader")?.classList.remove("active");
  },

  /* ── Mobile Menu ── */
  setupMobileMenu() {
    const btn = document.getElementById("mobileMenuBtn");
    const sidebar = document.querySelector(".sidebar");
    if (btn && sidebar) {
      btn.addEventListener("click", () => sidebar.classList.toggle("open"));
    }
  },

  /* ── Active Nav ── */
  highlightActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("active");
      const href = item.getAttribute("href");
      if (href && href !== "#") {
        try {
          const url = new URL(href, window.location.origin + path);
          if (url.pathname === path) {
            item.classList.add("active");
          }
        } catch (e) {
          const fileName = path.split("/").pop() || "index.html";
          if (href.includes(fileName)) {
            item.classList.add("active");
          }
        }
      }
    });
  },

  /* ── User Display — uses name field (3NF) ── */
  renderUserInfo() {
    const el = document.getElementById("userDisplay");
    if (el && this.state.user) {
      const u = this.state.user;
      const name = u.name || u.email;
      const initials = this.getInitials(name);
      
      let avatarHtml = `<div class="user-avatar avatar-sm">${initials}</div>`;
      if (u.avatar_url) {
        avatarHtml = `<img src="${this.getAvatarUrl(u.avatar_url)}" class="user-avatar avatar-sm" style="object-fit: cover;" alt="Avatar">`;
      }

      el.innerHTML = `
        <div class="user-avatar-btn" id="userMenuBtn">
          ${avatarHtml}
          <div class="user-info">
            <div class="user-name">${name}</div>
            <div class="user-role">${u.role}</div>
          </div>
        </div>
      `;
    }
  },

  /* ── User Initials ── */
  getInitials(name) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  },

  /* ── Logout ── */
  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/frontend/pages/guest/login.html";
  },

  /* ── Empty State HTML ── */
  emptyState(icon, title, desc, actionHtml = "") {
    return `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-${icon}"></i></div>
        <div class="empty-state-title">${title}</div>
        <div class="empty-state-desc">${desc}</div>
        ${actionHtml}
      </div>
    `;
  },

  /* ── Table Loading Row ── */
  tableLoading(cols) {
    return `<tr><td colspan="${cols}" class="text-center text-muted" style="padding:2rem;">
      <div class="spinner" style="margin:0 auto;width:28px;height:28px;border-width:2px;"></div>
      <div style="margin-top:0.5rem;font-size:0.8rem;">Đang tải...</div>
    </td></tr>`;
  },

  tableEmpty(cols, message = "Không có dữ liệu") {
    return `<tr><td colspan="${cols}" class="text-center text-muted" style="padding:2rem;">${message}</td></tr>`;
  },
};

// Init on DOM ready
document.addEventListener("DOMContentLoaded", () => App.init());
