-- ============================================================
-- HỆ THỐNG THUÊ PHÒNG TRỌ VÀ GHÉP ĐÔI
-- FINAL DATABASE DESIGN (3NF - FINAL STABLE VERSION)
-- Database: MySQL 8+
-- ============================================================

-- ============================================================
-- GHI CHÚ THIẾT KẾ
-- ============================================================
-- ✅ Chuẩn hóa 1NF, 2NF, 3NF
-- ✅ Tách RoomImages và RoomAmenities khỏi Rooms
-- ✅ Address tách city + district + street
-- ✅ Notifications dùng Polymorphic Reference
-- ✅ Contracts giữ owner_id + user_id (intentional denormalization)
-- ✅ Thanh toán chỉ là mô phỏng nội bộ (SIMULATED)
-- ✅ CHECK NULL-safe cho area, budget, deposit
-- ✅ reject_reason cho Rooms và RentalRequests
-- ✅ resolved_at cho SupportRequests
-- ✅ signed_at cho Contracts (UC-08)
-- ✅ transaction_code cho Payments
-- ✅ payment_type cho Payments
-- ✅ image_order cho RoomImages
-- ✅ Composite index tối ưu truy vấn phổ biến
-- ✅ RoommateRequests reverse duplicate xử lý ở tầng service
-- ============================================================


-- ============================================================
-- RESET
-- ============================================================
DROP DATABASE IF EXISTS room_rental_db;
CREATE DATABASE room_rental_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE room_rental_db;

SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE Users (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,

    -- UNIQUE: số điện thoại không được trùng giữa các tài khoản
    phone      VARCHAR(20) UNIQUE,

    role       ENUM('USER', 'OWNER', 'ADMIN') NOT NULL,
    status     ENUM('ACTIVE', 'BLOCKED') DEFAULT 'ACTIVE',
    avatar_url VARCHAR(500) DEFAULT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_role   (role),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 2. ROOMS
-- [3NF] address tách thành city + district + street
--       để hỗ trợ lọc theo khu vực, tránh phụ thuộc bắc cầu
-- reject_reason: Admin điền lý do khi từ chối duyệt phòng
-- ============================================================
CREATE TABLE Rooms (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    owner_id      INT NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    price         DECIMAL(10,2) NOT NULL,
    area          DECIMAL(6,2),
    city          VARCHAR(100) NOT NULL,
    district      VARCHAR(100) NOT NULL,
    street        VARCHAR(255),
    status        ENUM('PENDING', 'AVAILABLE', 'RENTED', 'REJECTED') DEFAULT 'PENDING',

    -- Lý do từ chối duyệt (NULL nếu không bị từ chối)
    reject_reason TEXT,

    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id) REFERENCES Users(id) ON DELETE CASCADE,

    CHECK (price > 0),
    -- NULL-safe: nếu có giá trị thì phải > 0
    CHECK (area IS NULL OR area > 0),

    INDEX idx_room_owner    (owner_id),
    INDEX idx_room_price    (price),
    INDEX idx_room_area     (area),
    INDEX idx_room_city     (city),
    INDEX idx_room_district (district),
    INDEX idx_room_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 3. ROOM IMAGES
-- [3NF] Tách hình ảnh ra bảng riêng tránh lặp nhóm
-- image_order: thứ tự hiển thị ảnh trong gallery (0 = ảnh đại diện)
-- ============================================================
CREATE TABLE RoomImages (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    room_id     INT NOT NULL,
    image_url   VARCHAR(500) NOT NULL,
    image_order INT DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id) REFERENCES Rooms(id) ON DELETE CASCADE,

    CHECK (image_order >= 0),

    INDEX idx_room_image_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 4. ROOM AMENITIES
-- [3NF] Tách tiện ích ra bảng riêng:
--   - Tránh bảng Rooms phình to
--   - Dễ mở rộng thêm tiện ích sau
--   - Hỗ trợ lọc theo tiện ích (UC-03)
-- Quan hệ: Rooms 1 ───── 1 RoomAmenities
-- ============================================================
CREATE TABLE RoomAmenities (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    room_id          INT NOT NULL UNIQUE,
    wifi             BOOLEAN DEFAULT FALSE,
    parking          BOOLEAN DEFAULT FALSE,
    air_conditioner  BOOLEAN DEFAULT FALSE,
    private_bathroom BOOLEAN DEFAULT FALSE,
    kitchen          BOOLEAN DEFAULT FALSE,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (room_id) REFERENCES Rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 5. RENTAL REQUESTS
-- reject_reason: Owner điền lý do khi từ chối yêu cầu thuê
-- updated_at: theo dõi khi Owner cập nhật trạng thái
-- ============================================================
CREATE TABLE RentalRequests (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    user_id       INT NOT NULL,
    room_id       INT NOT NULL,
    note          TEXT,
    status        ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',

    -- Lý do từ chối yêu cầu thuê (NULL nếu không bị từ chối)
    reject_reason TEXT,

    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES Rooms(id) ON DELETE CASCADE,

    INDEX idx_rental_user   (user_id),
    INDEX idx_rental_room   (room_id),
    INDEX idx_rental_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 6. CONTRACTS
-- [Ghi chú] owner_id, user_id là intentional denormalization
--           giúp query nhanh, không cần JOIN nhiều bảng
-- signed_at: thời điểm User ký xác nhận hợp đồng (UC-08)
-- ============================================================
CREATE TABLE Contracts (
    id                INT PRIMARY KEY AUTO_INCREMENT,
    rental_request_id INT NOT NULL UNIQUE,
    owner_id          INT NOT NULL,
    user_id           INT NOT NULL,
    room_id           INT NOT NULL,
    monthly_rent      DECIMAL(10,2) NOT NULL DEFAULT 0,
    deposit           DECIMAL(10,2),
    start_date        DATE NOT NULL,
    end_date          DATE NOT NULL,
    terms             TEXT,
    status            ENUM('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',

    -- Thời điểm User ký xác nhận hợp đồng (NULL khi chưa ký)
    signed_at         DATETIME,

    -- Thời điểm hợp đồng bị chấm dứt/hủy (NULL nếu chưa cancel)
    cancelled_at      DATETIME,

    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
                          ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (rental_request_id) REFERENCES RentalRequests(id) ON DELETE CASCADE,
    -- RESTRICT: không cho xóa User nếu còn hợp đồng liên quan
    FOREIGN KEY (owner_id)          REFERENCES Users(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id)           REFERENCES Users(id) ON DELETE RESTRICT,
    -- RESTRICT: không cho xóa Phòng nếu còn hợp đồng liên kết
    FOREIGN KEY (room_id)           REFERENCES Rooms(id) ON DELETE RESTRICT,

    CHECK (end_date > start_date),
    -- NULL-safe: tiền cọc có thể NULL, nếu có giá trị thì >= 0
    CHECK (deposit IS NULL OR deposit >= 0),

    INDEX idx_contract_owner  (owner_id),
    INDEX idx_contract_user   (user_id),
    INDEX idx_contract_room   (room_id),
    INDEX idx_contract_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 7. PAYMENTS
-- [Ghi chú] Thanh toán MÔ PHỎNG nội bộ (không tích hợp cổng thật)
-- payment_type: phân loại khoản thanh toán
-- transaction_code: mã giao dịch mô phỏng để trace/audit
-- UNIQUE(contract_id, billing_month, payment_type): cho phép
--   tạo cả DEPOSIT lẫn MONTHLY_RENT trong cùng tháng
-- ============================================================
CREATE TABLE Payments (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    contract_id      INT NOT NULL,
    billing_month    DATE NOT NULL,
    amount           DECIMAL(10,2) NOT NULL,
    due_date         DATE,
    payment_date     DATETIME,

    -- Phân loại khoản thanh toán
    payment_type     ENUM('DEPOSIT', 'MONTHLY_RENT', 'OTHER') NOT NULL,

    -- Mô phỏng nội bộ
    method           ENUM('SIMULATED') DEFAULT 'SIMULATED',

    -- Mã giao dịch sinh tự động khi thanh toán thành công
    transaction_code VARCHAR(100) UNIQUE,

    status           ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (contract_id) REFERENCES Contracts(id) ON DELETE CASCADE,

    CHECK (amount > 0),

    -- Tránh tạo 2 hóa đơn cùng loại trong cùng tháng cho 1 hợp đồng
    UNIQUE (contract_id, billing_month, payment_type),

    INDEX idx_payment_contract (contract_id),
    INDEX idx_payment_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8. ROOMMATE PROFILES
-- birth_date thay vì age: age thay đổi theo thời gian,
--   birth_date mới chuẩn DB design
-- ============================================================
CREATE TABLE RoommateProfiles (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    user_id       INT NOT NULL UNIQUE,
    gender        ENUM('MALE', 'FEMALE', 'OTHER'),
    birth_date    DATE,
    budget        DECIMAL(10,2),
    cleanliness   TINYINT,
    sleep_time    ENUM('EARLY', 'LATE', 'FLEXIBLE'),
    work_schedule ENUM('DAY', 'NIGHT', 'FLEXIBLE'),
    is_smoking    BOOLEAN DEFAULT FALSE,
    has_pet       BOOLEAN DEFAULT FALSE,
    bio           TEXT,
    is_search_active BOOLEAN DEFAULT TRUE,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,

    CHECK (cleanliness BETWEEN 1 AND 5),
    -- NULL-safe: ngân sách có thể NULL, nếu có giá trị thì > 0
    CHECK (budget IS NULL OR budget > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8b. TAGS — Danh sách "từ điển" đặc điểm lối sống
-- name UNIQUE: tránh trùng tag, đảm bảo đếm tag chung chính xác
-- Dữ liệu được seed sẵn, không cần CRUD từ Admin
-- ============================================================
CREATE TABLE Tags (
    id   INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 8c. PROFILE TAGS — Bảng nối N-N (RoommateProfiles ↔ Tags)
-- Composite PK (profile_id, tag_id): mỗi cặp chỉ xuất hiện 1 lần
-- ON DELETE CASCADE: xóa profile hoặc tag → tự dọn liên kết
-- Không cần index thủ công vì PK tự tạo index trên (profile_id, tag_id)
-- ============================================================
CREATE TABLE ProfileTags (
    profile_id INT NOT NULL,
    tag_id     INT NOT NULL,

    PRIMARY KEY (profile_id, tag_id),
    FOREIGN KEY (profile_id) REFERENCES RoommateProfiles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id)     REFERENCES Tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. ROOMMATE MATCHES
-- CHECK (user1_id < user2_id): tránh duplicate (1,2) và (2,1)
-- ============================================================
CREATE TABLE RoommateMatches (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    user1_id   INT NOT NULL,
    user2_id   INT NOT NULL,
    score      DECIMAL(5,2),
    status     ENUM('SUGGESTED', 'VIEWED', 'CONNECTED') DEFAULT 'SUGGESTED',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user1_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES Users(id) ON DELETE CASCADE,

    UNIQUE (user1_id, user2_id),

    CHECK (score BETWEEN 0 AND 100),
    CHECK (user1_id < user2_id),

    INDEX idx_match_user1 (user1_id),
    INDEX idx_match_user2 (user2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. ROOMMATE REQUESTS
-- NOTE: UNIQUE(sender_id, receiver_id) chặn duplicate cùng chiều.
--       Reverse duplicate (1→2 và 2→1) được xử lý ở tầng
--       application/service trước khi INSERT.
-- updated_at: theo dõi khi trạng thái thay đổi
-- [Ghi chú Đồng bộ] Bảng này hoạt động song song với RoommateMatches.
--   Khi Request chuyển thành ACCEPTED, Service Layer tự động cập
--   nhật Match thành CONNECTED (được bọc trong Transaction).
-- ============================================================
CREATE TABLE RoommateRequests (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    sender_id   INT NOT NULL,
    receiver_id INT NOT NULL,
    message     VARCHAR(1000) DEFAULT NULL,
    status      ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (sender_id)   REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(id) ON DELETE CASCADE,

    UNIQUE (sender_id, receiver_id),

    CHECK (sender_id <> receiver_id),

    INDEX idx_roommate_sender   (sender_id),
    INDEX idx_roommate_receiver (receiver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 11. SUPPORT REQUESTS
-- resolved_at: thời điểm Admin xử lý xong ticket
--   (khác với updated_at vì updated_at thay đổi mỗi khi edit)
-- [Ghi chú] Cột message/response là snapshot nội dung gốc của ticket.
--   Thread chi tiết (nhiều lượt trao đổi) nằm ở bảng SupportMessages.
--   Service ưu tiên đọc từ SupportMessages, fallback về cột này
--   khi bảng SupportMessages chưa tồn tại (backward-compatible).
--   *Lưu ý*: Cột response chỉ được write một lần khi ticket chuyển
--   sang RESOLVED. Các trao đổi sau đó chỉ lưu ở SupportMessages.
-- ============================================================
CREATE TABLE SupportRequests (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT NOT NULL,
    subject     VARCHAR(255),
    message     TEXT NOT NULL,
    response    TEXT,
    resolved_by INT,

    -- Thời điểm xử lý xong (NULL nếu chưa RESOLVED)
    resolved_at DATETIME,

    status      ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') DEFAULT 'OPEN',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)     REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES Users(id),

    INDEX idx_support_user   (user_id),
    INDEX idx_support_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE SupportMessages (
    id                  INT PRIMARY KEY AUTO_INCREMENT,
    support_request_id  INT NOT NULL,
    sender_id           INT NOT NULL,
    sender_role         ENUM('USER', 'OWNER', 'ADMIN') DEFAULT 'USER',
    message             TEXT NOT NULL,
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP
                        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (support_request_id) REFERENCES SupportRequests(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,

    INDEX idx_support_message_request (support_request_id),
    INDEX idx_support_message_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 12. NOTIFICATIONS
-- Polymorphic Reference: reference_id + reference_type
-- reference_type dùng VARCHAR(50) cho linh hoạt — mở rộng khi thêm module mới
--   (VD: SUPPORT, CONTRACT, PAYMENT, RENTAL_REQUEST, ROOMMATE_REQUEST...)
-- Composite index (user_id, is_read) cho query phổ biến:
--   WHERE user_id = ? AND is_read = false
-- ============================================================
CREATE TABLE Notifications (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    user_id        INT NOT NULL,
    type           VARCHAR(50) DEFAULT 'SYSTEM',
    reference_id   INT,
    reference_type VARCHAR(50),
    content        TEXT NOT NULL,
    is_read        BOOLEAN DEFAULT FALSE,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,

    -- Composite index: WHERE user_id = ? AND is_read = false
    INDEX idx_notification_user_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 13. FAVORITE ROOMS (OPTIONAL)
-- ============================================================
CREATE TABLE FavoriteRooms (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    user_id    INT NOT NULL,
    room_id    INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES Rooms(id) ON DELETE CASCADE,

    UNIQUE (user_id, room_id),

    INDEX idx_favorite_user (user_id),
    INDEX idx_favorite_room (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- QUAN HỆ ERD (FINAL – CHUẨN 3NF)
-- ============================================================
-- Users          1 ───── N  Rooms
-- Rooms          1 ───── N  RoomImages
-- Rooms          1 ───── 1  RoomAmenities
-- Users          1 ───── N  RentalRequests
-- Rooms          1 ───── N  RentalRequests
-- RentalRequests 1 ───── 1  Contracts
-- Contracts      1 ───── N  Payments
-- Rooms          1 ───── N  Contracts
-- Users          1 ───── 1  RoommateProfiles
-- RoommateProfiles N ─── N  Tags (via ProfileTags)
-- Users          N ───── N  Users (via RoommateMatches)
-- Users          N ───── N  Users (via RoommateRequests)
-- Users          1 ───── N  SupportRequests (user_id)
-- Users          1 ───── N  SupportRequests (resolved_by)
-- Users          1 ───── N  Notifications
-- Users          1 ───── N  FavoriteRooms
-- Rooms          1 ───── N  FavoriteRooms
-- ============================================================
-- FINAL VERSION COMPLETE
-- ============================================================
