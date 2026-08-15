# 🏠 Room Rental & Roommate Matching System

**Hệ thống Thuê Phòng Trọ & Ghép Đôi Bạn Ở Cùng**

> Đồ án thực tế — Ứng dụng web toàn diện quản lý phòng trọ và kết nối người ở ghép, hỗ trợ 4 vai trò độc lập: Guest, User, Owner, Admin.
>
> **Phiên bản:** 1.0.0 | **Cập nhật:** 2026-06-25 | **Người phát triển:** Hoàng Long

---

## 🌟 Tính năng nổi bật (Key Features)

### 1. Phân quyền chặt chẽ (Role-based Access)

- **Guest**: Tìm kiếm phòng trọ, lọc theo tiêu chí (giá, vị trí, tiện ích).
- **User (Người đi thuê)**: Gửi yêu cầu thuê phòng, theo dõi và ký hợp đồng, quản lý thanh toán, tìm bạn ở ghép (Roommate Matching), gửi vé hỗ trợ (Support Tickets).
- **Owner (Chủ trọ)**: Đăng tin phòng, duyệt người thuê, tự động sinh hợp đồng và hóa đơn hàng tháng, quản lý doanh thu.
- **Admin (Quản trị viên)**: Quản lý người dùng, kiểm duyệt bài đăng phòng, giải quyết vé hỗ trợ và xem thống kê hệ thống.

### 2. Thuật toán Ghép đôi Ở ghép (Roommate Matching)

- Dựa trên cơ chế **Trọng số (Weighted Scoring)** qua các tiêu chí: Ngân sách, Thói quen sinh hoạt (Giờ ngủ, Hút thuốc, Nuôi thú cưng, Sạch sẽ, Lịch làm việc).
- Hệ thống **Đặc điểm Lối sống (Lifestyle Tags)** với 30 nhãn đa dạng giúp tìm người đồng điệu.
- **Bảo mật Quyền riêng tư (Privacy-First)**: Ẩn hoàn toàn thông tin liên lạc (Email/SĐT) cho đến khi 2 bên chính thức chấp nhận (Accepted) lời mời ghép đôi. Tích hợp nút gạt **Bật/Tắt tìm kiếm**.

### 3. Tự động hóa Giao dịch & Hợp đồng

- **Smart Dashboard**: Phân tách rõ ràng giữa Tiền Cọc (Deposit) và Tiền Thuê (Rent).
- Tạo và duyệt hợp đồng trực tuyến (E-Contract).
- Quản lý kỳ thanh toán hàng tháng chi tiết.

---

## 🔒 Các biện pháp bảo mật hệ thống

Hệ thống được xây dựng theo định hướng an toàn và bảo vệ dữ liệu người dùng, bao gồm các cơ chế bảo mật sau:

### Xác thực và phân quyền

- Sử dụng JWT (JSON Web Token) để xác thực người dùng.
- Áp dụng cơ chế phân quyền theo vai trò (Role-Based Access Control):
  - Guest
  - User
  - Owner
  - Admin
- Token có thời hạn sử dụng và được kiểm tra ở mọi API yêu cầu đăng nhập.

### Bảo vệ mật khẩu

- Mật khẩu được mã hóa bằng bcryptjs trước khi lưu vào cơ sở dữ liệu.
- Không lưu mật khẩu dạng văn bản thuần (Plain Text).

### Chống tấn công SQL Injection

- Toàn bộ truy vấn cơ sở dữ liệu sử dụng Parameterized Query.
- Không nối chuỗi SQL trực tiếp từ dữ liệu người dùng nhập vào.

### Chống tấn công XSS (Cross-Site Scripting)

- Kiểm tra và chuẩn hóa dữ liệu đầu vào.
- Escape nội dung hiển thị từ người dùng trước khi render giao diện.

### Giới hạn tần suất truy cập (Rate Limiting)

- API thông thường:
  - 1000 yêu cầu / 15 phút / IP
- API Đăng nhập & Đăng ký:
  - 10 yêu cầu / 15 phút / IP
- Giảm nguy cơ tấn công Brute Force và Spam Request.

### Bảo mật HTTP Header

- Sử dụng Helmet để cấu hình các HTTP Security Headers.
- Hỗ trợ phòng chống:
  - Clickjacking
  - MIME Sniffing
  - Một số hình thức XSS phổ biến

### Kiểm tra dữ liệu đầu vào

- Sử dụng express-validator để xác thực dữ liệu từ Client.
- Đảm bảo dữ liệu đúng định dạng trước khi xử lý.

### Bảo mật tải lên hình ảnh

- Giới hạn kích thước tệp tải lên.
- Chỉ cho phép các định dạng hình ảnh hợp lệ.
- Tách riêng thư mục lưu trữ ảnh người dùng.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

| Layer                  | Công nghệ                                                                 |
| ---------------------- | ------------------------------------------------------------------------- |
| **Frontend**           | HTML5, CSS3 (Custom Design System, biến CSS hiện đại), Vanilla JavaScript |
| **Backend**            | Node.js, Express.js                                                       |
| **Database**           | MySQL 8.0 (InnoDB, utf8mb4)                                               |
| **Bảo mật & Xác thực** | JWT (jsonwebtoken), bcryptjs                                              |
| **Upload Files**       | Multer                                                                    |
| **Validation**         | express-validator                                                         |

---

## 🏗 Cấu trúc dự án (Folder Structure)

```text
room-rental/
├── backend/                # Server REST API (Express.js)
│   ├── server.js           # Điểm khởi chạy
│   ├── .env                # Biến môi trường
│   ├── package.json
│   ├── scripts/            # Script tự động (run-sql)
│   └── src/
│       ├── config/         # Kết nối MySQL
│       ├── controllers/    # API Controllers (10 Modules)
│       ├── middleware/     # Auth, Upload, Error Handling
│       ├── routes/         # Khai báo Routes
│       ├── services/       # Logic Nghiệp vụ (Business Logic)
│       ├── utils/          # Chuẩn hóa Response
│       └── uploads/        # Thư mục lưu trữ ảnh
├── database/               # Khởi tạo dữ liệu
│   ├── run-sql.js          # Script tự động nạp DB
│   ├── schema.sql          # Định nghĩa 14 Bảng chuẩn 3NF
│   └── seed.sql            # Dữ liệu mẫu (Mock data)
├── frontend/               # Giao diện người dùng
│   ├── index.html          # Trang chủ Landing Page
│   ├── assets/
│   │   ├── css/            # style.css (Core), responsive.css
│   │   └── js/             # app.js (Utils), auth.js
│   └── pages/              # Các trang theo phân quyền
│       ├── guest/          # Đăng nhập, Danh sách phòng, Chi tiết phòng...
│       ├── user/           # Bảng điều khiển, Hợp đồng, Hồ sơ ở ghép...
│       ├── owner/          # Quản lý trọ, Hóa đơn, Đăng phòng...
│       └── admin/          # Quản trị hệ thống, Thống kê...
└── README.md
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy (Setup & Run)

### 1. Thiết lập Database

Dự án được trang bị sẵn Script tự động để khởi tạo bảng và chèn dữ liệu mẫu, bạn không cần phải copy code SQL thủ công!

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt thư viện Node.js
npm install

# (Tùy chọn) Kiểm tra cấu hình kết nối DB tại tệp: backend/.env
# PORT=5002
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=yourpassword
# DB_NAME=room_rental_db

# Chạy Script để tạo bảng và nạp dữ liệu mẫu
node scripts/run-sql.js
```

### 2. Khởi chạy Backend Server

```bash
# Đang ở thư mục backend/
npm start
# Hoặc dùng npm run dev (nếu có cài nodemon)
```

> Server sẽ chạy tại: `http://localhost:5002` (cổng tự động chuyển nếu bị trùng).

### 3. Khởi chạy Frontend

Dự án sử dụng thuần HTML/CSS/JS, bạn có thể chạy bằng bất kỳ HTTP Server tĩnh nào:

- **Cách 1**: Dùng tiện ích `Live Server` trên VS Code (Chuột phải `index.html` → Open with Live Server).
- **Cách 2**: Sử dụng npm `serve`:
  ```bash
  # Mở một Terminal khác ở thư mục gốc của dự án (room-rental)
  npx serve . -l 3000
  ```

---

## 🔐 Tài khoản Trải nghiệm (Mock Accounts)

Tất cả tài khoản trong dữ liệu mẫu đều sử dụng chung mật khẩu là: **`23090026`** (hoặc tùy cấu hình seed hiện tại).

| Email                       | Vai trò (Role) | Chú thích                    |
| --------------------------- | -------------- | ---------------------------- |
| `admin@roomrental.com`      | **Admin**      | Quản trị viên toàn quyền     |
| `ahmad.owner@gmail.com`     | **Owner**      | Chủ nhà trọ (Đã có phòng)    |
| `siti.properties@gmail.com` | **Owner**      | Chủ nhà trọ                  |
| `john.doe@gmail.com`        | **User**       | Người đi thuê / Tìm bạn ghép |
| `jane.smith@gmail.com`      | **User**       | Người đi thuê                |
| `wei.chen@gmail.com`        | **User**       | Người đi thuê                |

---

## 📡 Danh sách API Endpoints chính

| Module            | Prefix               | Chức năng chính                          |
| ----------------- | -------------------- | ---------------------------------------- |
| **Auth**          | `/api/auth`          | Đăng ký, Đăng nhập, Check Token          |
| **Rooms**         | `/api/rooms`         | CRUD phòng, Tìm kiếm, Lọc nhiều tiêu chí |
| **Rentals**       | `/api/rentals`       | Yêu cầu thuê, Duyệt/Từ chối, Hủy         |
| **Contracts**     | `/api/contracts`     | Tạo hợp đồng, Chữ ký số mô phỏng         |
| **Payments**      | `/api/payments`      | Tạo hóa đơn, Thanh toán cọc/thuê         |
| **Roommates**     | `/api/roommates`     | Tìm bạn ở ghép, Lời mời, Hồ sơ lối sống  |
| **Notifications** | `/api/notifications` | Lấy thông báo, Đánh dấu đã đọc           |
| **Support**       | `/api/support`       | Gửi vé khiếu nại/hỗ trợ, Nhắn tin        |
| **Admin**         | `/api/admin`         | Thống kê, Duyệt phòng, Khóa tài khoản    |

---

_Dự án được xây dựng với mục tiêu cung cấp giải pháp chuyển đổi số toàn diện cho quy trình thuê trọ truyền thống._

---

## 🌿 Git Branching Strategy (Gitflow)

Dự án áp dụng **Gitflow Workflow** — mô hình quản lý nhánh chuyên nghiệp phù hợp với vòng đời phát triển phần mềm thực tế.

### Sơ đồ nhánh

```
main ──────────────────────────────────────────────► Production (ổn định)
  └─► release/v1.0.0 ──────────────────────────────► Release Candidate
develop ────────────────────────────────────────────► Integration (luôn chạy được)
  ├─► feature/auth-module            (Xác thực & JWT & RBAC)
  ├─► feature/room-management        (Đăng tin, CRUD phòng, Lọc/Tìm kiếm)
  ├─► feature/rental-contract        (Yêu cầu thuê, Duyệt, Hợp đồng điện tử)
  ├─► feature/payment-system         (Hóa đơn, Tiền cọc, Tiền thuê tháng)
  ├─► feature/roommate-matching      (Thuật toán ghép đôi, Lifestyle Tags)
  ├─► feature/notification-support   (Thông báo real-time, Vé hỗ trợ)
  └─► feature/admin-dashboard        (Thống kê, Kiểm duyệt, Quản lý user)
hotfix/base ─────────────────────────────────────────► Sửa lỗi khẩn cấp (từ main)
```

### Quy tắc làm việc

| Nhánh | Mục đích | Merge vào | Tạo từ |
|---|---|---|---|
| `main` | Production, luôn deployable | — | `release/*` hoặc `hotfix/*` |
| `develop` | Integration, base cho mọi feature | `release/*` | `main` |
| `feature/*` | Phát triển tính năng độc lập | `develop` | `develop` |
| `release/*` | Chuẩn bị release, chỉ sửa bug nhỏ | `main` + `develop` | `develop` |
| `hotfix/*` | Vá lỗi khẩn cấp trên production | `main` + `develop` | `main` |

### Quy ước đặt tên commit

```
feat:     Tính năng mới
fix:      Sửa lỗi
docs:     Cập nhật tài liệu
style:    Format code (không thay đổi logic)
refactor: Tái cấu trúc code
test:     Thêm/sửa test
chore:    Công việc bảo trì (build, config...)
```

**Ví dụ:**
```bash
git commit -m "feat(auth): add JWT refresh token mechanism"
git commit -m "fix(payment): correct deposit calculation for partial month"
git commit -m "docs: update API endpoint list in README"
```

### Quy trình merge (Pull Request Flow)

```
feature/xxx → develop    # PR với code review bắt buộc
develop → release/v1.0.0 # Khi đủ tính năng, tạo release
release/v1.0.0 → main    # Merge sau QA, gắn tag v1.0.0
main → hotfix/xxx        # Nếu có lỗi production
```

