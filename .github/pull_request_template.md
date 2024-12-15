## 📋 Mô tả thay đổi

> Mô tả ngắn gọn những gì bạn đã thay đổi và lý do tại sao.

---

## 🔗 Liên quan đến

- Closes #<!-- issue number -->
- Related to #<!-- issue number -->

---

## ✅ Loại thay đổi

- [ ] 🆕 `feat` — Tính năng mới (không phá vỡ tính năng cũ)
- [ ] 🐛 `fix` — Sửa lỗi (không phá vỡ tính năng cũ)
- [ ] 💥 `breaking change` — Thay đổi phá vỡ tính năng hiện có
- [ ] 📝 `docs` — Chỉ cập nhật tài liệu
- [ ] ♻️ `refactor` — Tái cấu trúc code (không thêm feature, không sửa bug)
- [ ] 🧪 `test` — Thêm hoặc sửa test

---

## 🧪 Kiểm thử

> Mô tả cách bạn đã test thay đổi này. Cung cấp hướng dẫn để reviewer có thể reproduce.

**Test environment:**
- [ ] Chạy backend: `npm start` trong `/backend`
- [ ] Test API bằng Postman / curl
- [ ] Kiểm tra giao diện trên browser

---

## 📸 Screenshots (nếu có thay đổi UI)

<!-- Thêm screenshot trước/sau nếu có thay đổi giao diện -->

| Trước | Sau |
|-------|-----|
|       |     |

---

## 🔍 Checklist trước khi merge

- [ ] Code đã được tự review kỹ
- [ ] Không có `console.log` debug thừa
- [ ] Không commit file `.env` chứa secrets
- [ ] Đặt tên commit theo Conventional Commits (`feat:`, `fix:`, `docs:`...)
- [ ] Nhánh được tạo từ `develop` (hoặc `main` nếu là hotfix)
- [ ] Đã test đủ các luồng chính (happy path + edge cases)
