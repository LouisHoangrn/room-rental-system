/**
 * Auth Module — Login & Register handlers
 * Updated for 3NF schema: name instead of first_name/last_name, UPPERCASE roles
 */
const Auth = {
  /* ── Login Form ── */
  initLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!email || !password) {
        App.showToast("Vui lòng nhập đầy đủ thông tin", "warning");
        return;
      }

      try {
        const res = await App.api("/auth/login", "POST", { email, password });
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        App.showToast("Đăng nhập thành công!", "success");

        setTimeout(() => {
          const role = (res.data.user.role || "").toUpperCase();
          if (role === "ADMIN")
            window.location.href = "/frontend/pages/admin/dashboard.html";
          else if (role === "OWNER")
            window.location.href = "/frontend/pages/owner/dashboard.html";
          else window.location.href = "/frontend/pages/guest/rooms.html";
        }, 500);
      } catch (err) {
        // toast already shown by App.api
      }
    });
  },

  /* ── Register Form ── */
  initRegister() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const role =
        document.querySelector('input[name="role"]:checked')?.value || "USER";

      // Validation
      if (!name || !email || !password) {
        App.showToast("Vui lòng nhập đầy đủ thông tin bắt buộc", "warning");
        return;
      }

      if (password.length < 6) {
        App.showToast("Mật khẩu phải có ít nhất 6 ký tự", "warning");
        return;
      }

      if (!/\d/.test(password)) {
        App.showToast("Mật khẩu phải chứa ít nhất 1 chữ số", "warning");
        return;
      }

      if (password !== confirmPassword) {
        App.showToast("Mật khẩu xác nhận không khớp", "warning");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        App.showToast("Email không hợp lệ", "warning");
        return;
      }

      try {
        const payload = { name, email, password, role };
        if (phone) payload.phone = phone;

        const res = await App.api("/auth/register", "POST", payload);

        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        App.showToast("Đăng ký thành công!", "success");

        setTimeout(() => {
          const roleStr = (role || "").toUpperCase();
          if (roleStr === "ADMIN")
            window.location.href = "/frontend/pages/admin/dashboard.html";
          else if (roleStr === "OWNER")
            window.location.href = "/frontend/pages/owner/dashboard.html";
          else window.location.href = "/frontend/pages/guest/rooms.html";
        }, 500);
      } catch (err) {
        // toast already shown
      }
    });
  },
};

document.addEventListener("DOMContentLoaded", () => {
  Auth.initLogin();
  Auth.initRegister();
});
