-- ============================================================
-- HỆ THỐNG THUÊ PHÒNG TRỌ VÀ GHÉP ĐÔI
-- SEED DATA — Realistic Vietnam Context
-- All passwords: bcrypt hash of 'password'
-- $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ============================================================

USE room_rental_db;

-- ============================================================
-- 1. USERS (1 admin + 3 owners + 6 users = 10 total)
-- ============================================================
INSERT INTO Users (id, name, email, password, phone, role, status) VALUES
-- Admin
(1, 'Hệ thống Admin',     'admin@roomrental.com',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0901234567', 'ADMIN', 'ACTIVE'),
-- Owners
(2, 'Trần Văn Nam',       'nam.tran@gmail.com',        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0912345678', 'OWNER', 'ACTIVE'),
(3, 'Nguyễn Thị Mai',     'mai.nguyen@gmail.com',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0923456789', 'OWNER', 'ACTIVE'),
(4, 'Lê Hoàng Long',      'long.le@gmail.com',         '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0934567890', 'OWNER', 'ACTIVE'),
-- Users
(5, 'Phạm Tuấn Anh',      'anh.pham@gmail.com',        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0945678901', 'USER',  'ACTIVE'),
(6, 'Võ Thị Thu',         'thu.vo@gmail.com',          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0956789012', 'USER',  'ACTIVE'),
(7, 'Đặng Hải Yến',       'yen.dang@gmail.com',        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0967890123', 'USER',  'ACTIVE'),
(8, 'Bùi Văn Cường',      'cuong.bui@gmail.com',       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0978901234', 'USER',  'ACTIVE'),
(9, 'Hồ Quang Hiếu',      'hieu.ho@gmail.com',         '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0989012345', 'USER',  'ACTIVE'),
(10,'Đinh Trọng Thủy',    'thuy.dinh@gmail.com',       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0990123456', 'USER',  'ACTIVE'),
(11, 'Vũ Thành Luân',     'luan.vu@gmail.com',         '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0991234567', 'USER',  'ACTIVE'),
(12, 'Lý Nhã Kỳ',         'ky.ly@gmail.com',           '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0992345678', 'USER',  'ACTIVE'),
(13, 'Phan Văn Đức',      'duc.phan@gmail.com',        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0993456789', 'USER',  'ACTIVE'),
(14, 'Trương Thảo Nhi',   'nhi.truong@gmail.com',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0994567890', 'USER',  'ACTIVE');


-- ============================================================
-- 2. ROOMS (15 rooms)
-- ============================================================
INSERT INTO Rooms (id, owner_id, title, description, price, area, city, district, street, status, reject_reason) VALUES
-- HỒ CHÍ MINH
(1, 2, 'Căn hộ Studio Vinhomes Central Park', 'Studio đầy đủ nội thất cao cấp, view Landmark 81 cực đẹp. Tiện ích nội khu hồ bơi, gym miễn phí. An ninh 24/7.', 12000000.00, 36.00, 'Hồ Chí Minh', 'Quận Bình Thạnh', '208 Nguyễn Hữu Cảnh', 'AVAILABLE', NULL),
(2, 3, 'Phòng trọ cao cấp có gác lửng Quận 7', 'Phòng mới xây có gác lửng đúc thật, bếp nấu ăn riêng. Khu vực an ninh gần Lotte Mart, thuận tiện qua Quận 1, Quận 4.', 4500000.00, 25.00, 'Hồ Chí Minh', 'Quận 7', 'Đường số 17, Tân Kiểng', 'AVAILABLE', NULL),
(3, 4, 'Ký túc xá cao cấp Sleepbox máy lạnh', 'Ký túc xá dạng sleepbox riêng tư, sạch sẽ, máy lạnh 24/24. Thích hợp cho sinh viên và người đi làm. Đã bao trọn gói điện nước wifi.', 1500000.00, 6.00, 'Hồ Chí Minh', 'Quận 10', 'Thành Thái', 'AVAILABLE', NULL),
(4, 2, 'Căn hộ mini ban công rộng rãi thoáng mát', 'Căn hộ mini 1 phòng ngủ tách biệt bếp. Ban công siêu rộng trồng được cây xanh. Gần đại học Hutech, Hồng Bàng.', 6500000.00, 40.00, 'Hồ Chí Minh', 'Quận Bình Thạnh', 'D2 (Nguyễn Gia Trí)', 'AVAILABLE', NULL),
(5, 3, 'Phòng trọ giá rẻ trung tâm Quận 3', 'Phòng nhỏ nhưng đầy đủ cơ bản (giường, tủ, quạt). Ưu tiên nữ sinh viên hoặc người đi làm văn phòng ở ghép. Giờ giấc tự do.', 3000000.00, 15.00, 'Hồ Chí Minh', 'Quận 3', 'Lê Văn Sỹ', 'PENDING', NULL),
(6, 4, 'Nhà nguyên căn hẻm xe hơi Quận Phú Nhuận', 'Nhà nguyên căn 1 trệt 2 lầu, 3 phòng ngủ phù hợp gia đình hoặc nhóm bạn. Hẻm an ninh, yên tĩnh, không ngập nước.', 15000000.00, 90.00, 'Hồ Chí Minh', 'Quận Phú Nhuận', 'Phan Xích Long', 'AVAILABLE', NULL),

-- HÀ NỘI
(7, 2, 'Chung cư mini Cầu Giấy full đồ', 'Phòng chung cư mini ngõ rộng xe ba gác vào tận cửa. Full đồ: điều hòa, nóng lạnh, giường tủ, máy giặt chung. Gần ĐH Quốc Gia.', 4200000.00, 22.00, 'Hà Nội', 'Quận Cầu Giấy', 'Ngõ 175 Xuân Thủy', 'AVAILABLE', NULL),
(8, 3, 'Căn hộ D\'Capitale Trần Duy Hưng', 'Cho thuê căn hộ 2 phòng ngủ cao cấp D\'Capitale Trần Duy Hưng. View hồ điều hòa siêu đẹp, nội thất nhập khẩu châu Âu sang trọng.', 18000000.00, 75.00, 'Hà Nội', 'Quận Cầu Giấy', '119 Trần Duy Hưng', 'AVAILABLE', NULL),
(9, 4, 'Phòng trọ khép kín Đống Đa', 'Phòng khép kín sạch sẽ tầng 3, có cửa sổ thoáng. Gần ĐH Thủy Lợi, Công Đoàn. Điện 4k/số, nước 100k/người. Không chung chủ.', 2800000.00, 18.00, 'Hà Nội', 'Quận Đống Đa', 'Ngõ 165 Chùa Bộc', 'AVAILABLE', NULL),
(10, 2, 'Phòng Master khu biệt thự Tây Hồ', 'Cho thuê phòng master trong biệt thự ven Hồ Tây. Không gian yên tĩnh, an ninh cực tốt, thích hợp cho người nước ngoài hoặc chuyên gia.', 8500000.00, 45.00, 'Hà Nội', 'Quận Tây Hồ', 'Xuân Diệu', 'AVAILABLE', NULL),
(11, 3, 'Studio phong cách Indochine phố cổ', 'Studio thiết kế phong cách Đông Dương cực chill ngay trung tâm phố cổ. Vài bước chân ra Hồ Gươm. Thích hợp cho các bạn trẻ thích sống ảo.', 7000000.00, 30.00, 'Hà Nội', 'Quận Hoàn Kiếm', 'Hàng Bông', 'PENDING', NULL),

-- ĐÀ NẴNG
(12, 4, 'Căn hộ view biển Mỹ Khê', 'Căn hộ 1 phòng ngủ tầng cao view trực diện biển Mỹ Khê tuyệt đẹp. Đầy đủ tiện nghi chỉ xách vali vào ở. Có chỗ đậu xe oto.', 9000000.00, 50.00, 'Đà Nẵng', 'Quận Sơn Trà', 'Võ Nguyên Giáp', 'AVAILABLE', NULL),
(13, 2, 'Phòng trọ sinh viên gần ĐH Bách Khoa ĐN', 'Phòng trọ sạch sẽ, mới sơn sửa lại. Nằm trong khu dân cư đông đúc, nhiều quán ăn giá rẻ sinh viên. Có nhà xe rộng rãi.', 1800000.00, 20.00, 'Đà Nẵng', 'Quận Liên Chiểu', 'Nguyễn Lương Bằng', 'AVAILABLE', NULL),
(14, 3, 'Homestay cho thuê tháng Hải Châu', 'Phòng dạng homestay có bếp chung dưới tầng trệt. Decor phong cách Hàn Quốc siêu dễ thương. Giá thuê đã bao gồm dọn phòng 1 lần/tuần.', 5500000.00, 28.00, 'Đà Nẵng', 'Quận Hải Châu', 'Lê Duẩn', 'AVAILABLE', NULL),
(15, 4, 'Nhà nguyên căn 2 tầng Cẩm Lệ', 'Nhà mặt tiền đường 5m5, lề 3m. Thích hợp mở văn phòng công ty kết hợp ở. 3 phòng ngủ, 2 WC. Khu vực an ninh, yên tĩnh.', 11000000.00, 120.00, 'Đà Nẵng', 'Quận Cẩm Lệ', 'Nguyễn Hữu Thọ', 'AVAILABLE', NULL);


-- ============================================================
-- 3. ROOM IMAGES (Sử dụng link ảnh Unsplash thực tế)
-- ============================================================
INSERT INTO RoomImages (room_id, image_url, image_order) VALUES
-- Room 1: Studio Vinhomes (Sang trọng, hiện đại)
(1, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),
(1, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 1),
(1, 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 2),

-- Room 2: Phòng trọ gác lửng Quận 7
(2, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),
(2, 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 1),

-- Room 3: Sleepbox (Nhỏ, giường tầng)
(3, 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),
(3, 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 1),

-- Room 4: Căn hộ ban công rộng
(4, 'https://images.unsplash.com/photo-1501183638710-841dd1904471?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),
(4, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 1),

-- Room 5: Phòng trọ giá rẻ Quận 3
(5, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),

-- Room 6: Nhà nguyên căn Phú Nhuận
(6, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),
(6, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 1),

-- Room 7: Chung cư mini Cầu Giấy
(7, 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),

-- Room 8: Căn hộ D'Capitale (Cao cấp)
(8, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),
(8, 'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 1),

-- Room 9: Phòng khép kín Đống Đa
(9, 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),

-- Room 10: Master Tây Hồ (Sang trọng, view đẹp)
(10, 'https://images.unsplash.com/photo-1501183638710-841dd1904471?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),

-- Room 11: Studio Indochine (Cổ điển)
(11, 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),

-- Room 12: Căn hộ view biển Đà Nẵng
(12, 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),

-- Room 13: Phòng sinh viên Bách Khoa
(13, 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),

-- Room 14: Homestay Hải Châu
(14, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0),

-- Room 15: Nhà Cẩm Lệ
(15, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', 0);


-- ============================================================
-- 4. ROOM AMENITIES
-- ============================================================
INSERT INTO RoomAmenities (room_id, wifi, parking, air_conditioner, private_bathroom, kitchen) VALUES
(1, TRUE, TRUE, TRUE, TRUE, TRUE),
(2, TRUE, TRUE, TRUE, TRUE, TRUE),
(3, TRUE, TRUE, TRUE, FALSE, FALSE),
(4, TRUE, TRUE, TRUE, TRUE, TRUE),
(5, TRUE, TRUE, FALSE, TRUE, FALSE),
(6, TRUE, TRUE, TRUE, TRUE, TRUE),
(7, TRUE, TRUE, TRUE, TRUE, TRUE),
(8, TRUE, TRUE, TRUE, TRUE, TRUE),
(9, TRUE, TRUE, FALSE, TRUE, TRUE),
(10, TRUE, TRUE, TRUE, TRUE, FALSE),
(11, TRUE, FALSE, TRUE, TRUE, TRUE),
(12, TRUE, TRUE, TRUE, TRUE, TRUE),
(13, TRUE, TRUE, FALSE, TRUE, FALSE),
(14, TRUE, TRUE, TRUE, TRUE, TRUE),
(15, TRUE, TRUE, TRUE, TRUE, TRUE);


-- ============================================================
-- 5. RENTAL REQUESTS
-- ============================================================
INSERT INTO RentalRequests (id, user_id, room_id, note, status, reject_reason) VALUES
(1, 5, 1, 'Chào anh Nam, em làm IT gần Vinhomes. Muốn thuê dài hạn 1 năm. Xin xem phòng ạ.', 'APPROVED', NULL),
(2, 6, 2, 'Chào chị Mai, em sinh viên năm cuối Rmit, ở 1 mình, gọn gàng. Chiều nay em qua xem được không?', 'PENDING', NULL),
(3, 7, 7, 'Phòng này còn trống không anh? Mình muốn thuê từ đầu tháng tới.', 'REJECTED', 'Phòng này vừa có khách cọc rồi bạn nhé.'),
(4, 8, 12, 'Hi anh Long, e là dev remote, cần không gian yên tĩnh. Có thể bớt chút xíu lấy may không anh?', 'APPROVED', NULL);


-- ============================================================
-- 6. CONTRACTS
-- ============================================================
INSERT INTO Contracts (id, rental_request_id, owner_id, user_id, room_id, monthly_rent, deposit, start_date, end_date, status, signed_at) VALUES
(1, 1, 2, 5, 1, 12000000.00, 24000000.00, '2026-06-01', '2027-06-01', 'ACTIVE', '2026-05-28 09:00:00'),
(2, 4, 4, 8, 12, 9000000.00, 9000000.00, '2026-06-15', '2026-12-15', 'ACTIVE', '2026-06-10 15:30:00');


-- ============================================================
-- 7. PAYMENTS
-- ============================================================
INSERT INTO Payments (id, contract_id, billing_month, amount, due_date, payment_date, payment_type, method, transaction_code, status) VALUES
(1, 1, '2026-06-01', 24000000.00, '2026-05-28', '2026-05-28 09:15:00', 'DEPOSIT', 'SIMULATED', 'TXN-001', 'PAID'),
(2, 1, '2026-06-01', 12000000.00, '2026-06-01', '2026-06-01 08:00:00', 'MONTHLY_RENT', 'SIMULATED', 'TXN-002', 'PAID'),
(3, 2, '2026-06-15', 9000000.00,  '2026-06-10', '2026-06-10 15:45:00', 'DEPOSIT', 'SIMULATED', 'TXN-003', 'PAID');


-- ============================================================
-- 8. ROOMMATE PROFILES
-- ============================================================
INSERT INTO RoommateProfiles (user_id, gender, birth_date, budget, cleanliness, sleep_time, work_schedule, is_smoking, has_pet, bio) VALUES
(5, 'MALE', '2000-05-15', 3000000.00, 4, 'EARLY', 'DAY', FALSE, FALSE, 'Nam nhân viên IT, hiền lành, ít nói, làm giờ hành chính. Thường về quê cuối tuần.'),
(6, 'FEMALE', '2003-10-20', 2000000.00, 5, 'FLEXIBLE', 'DAY', FALSE, FALSE, 'Nữ sinh viên ngân hàng, thích nấu ăn, sạch sẽ. Đang tìm 1-2 bạn nữ ở ghép để share tiền phòng khu vực Quận 7.'),
(7, 'FEMALE', '2001-08-08', 4000000.00, 3, 'LATE', 'FLEXIBLE', FALSE, TRUE, 'Làm marketing, hay về trễ. Không ngại nuôi mèo (mình có 1 bé mèo ngoan). Tìm bạn ghép vui vẻ hòa đồng.'),
(8, 'MALE', '1998-12-05', 3500000.00, 5, 'EARLY', 'DAY', FALSE, FALSE, 'Kỹ sư xây dựng, đi làm cả ngày tối mới về. Thích không gian sạch sẽ, gọn gàng, tôn trọng sự riêng tư.'),
(9, 'MALE', '2002-04-11', 2500000.00, 3, 'LATE', 'FLEXIBLE', TRUE, FALSE, 'Sinh viên năm cuối ĐH Kiến Trúc, hay làm đồ án thức khuya. Thoải mái, hòa đồng, thi thoảng có hút thuốc ngoài ban công.'),
(10, 'FEMALE', '1999-09-22', 5000000.00, 4, 'EARLY', 'DAY', FALSE, TRUE, 'Nhân viên thiết kế đồ họa, mang theo 1 chú cún Poodle nhỏ rất ngoan. Tìm bạn nữ chung sở thích yêu động vật, có thể share tiền thuê nguyên căn hộ.'),
(11, 'MALE', '1995-11-30', 4500000.00, 5, 'EARLY', 'DAY', FALSE, FALSE, 'Chuyên viên tài chính ngân hàng, lối sống rất kỷ luật và sạch sẽ. Đang tìm phòng Master khu vực Ba Đình hoặc Cầu Giấy để ở lâu dài.'),
(12, 'FEMALE', '2004-02-14', 1500000.00, 3, 'LATE', 'FLEXIBLE', FALSE, FALSE, 'Sinh viên năm nhất ĐH Khoa học Tự nhiên. Hiền lành, biết nấu ăn nhưng đôi khi hay bày bừa lúc học thi. Muốn tìm phòng gần trường KHTN HCM.'),
(13, 'MALE', '1992-06-25', 6000000.00, 4, 'FLEXIBLE', 'FLEXIBLE', TRUE, TRUE, 'Photographer tự do, nuôi một chú mèo Anh lông ngắn. Thời gian làm việc không cố định. Tìm căn hộ nguyên căn share 2 người khu vực gần trung tâm Đà Nẵng.'),
(14, 'FEMALE', '1997-07-07', 3500000.00, 5, 'LATE', 'DAY', FALSE, FALSE, 'Giáo viên tiếng Anh, buổi tối hay dạy online nên cần không gian yên tĩnh. Gọn gàng, ngăn nắp, thích trang trí nhà cửa xinh xắn.');


-- ============================================================
-- 9. TAGS & PROFILE TAGS
-- ============================================================
INSERT INTO Tags (id, name) VALUES
(1, 'Sinh viên'),
(2, 'Nhân viên VP'),
(3, 'Sạch sẽ'),
(4, 'Ít nói'),
(5, 'Có nuôi pet'),
(6, 'Thích nấu ăn'),
(7, 'Thích thể thao'),
(8, 'Đọc sách'),
(9, 'Nghe nhạc'),
(10, 'Xem phim'),
(11, 'Hướng ngoại'),
(12, 'Hướng nội'),
(13, 'Thức khuya'),
(14, 'Dậy sớm'),
(15, 'Không hút thuốc'),
(16, 'Thỉnh thoảng nhậu'),
(17, 'Yêu động vật'),
(18, 'Thích du lịch'),
(19, 'Chơi game'),
(20, 'Thích tiệc tùng'),
(21, 'Ghét ồn ào'),
(22, 'Ăn chay'),
(23, 'Sống tối giản'),
(24, 'Công nghệ'),
(25, 'Nhiếp ảnh'),
(26, 'Khách đến chơi'),
(27, 'Tập gym'),
(28, 'Nghệ thuật'),
(29, 'Dễ tính'),
(30, 'Sợ bẩn');

INSERT INTO ProfileTags (profile_id, tag_id) VALUES
(1, 2), (1, 3), (1, 4), (1, 14), (1, 15), (1, 21), -- Phạm Tuấn Anh (NV VP, sạch sẽ, ít nói, dậy sớm, k hút thuốc, ghét ồn ào)
(2, 1), (2, 3), (2, 6), (2, 18), (2, 29), -- Võ Thị Thu (Sinh viên, sạch sẽ, nấu ăn, du lịch, dễ tính)
(3, 2), (3, 5), (3, 11), (3, 13), (3, 17), (3, 20), -- Đặng Hải Yến (NV VP, pet, hướng ngoại, thức khuya, yêu động vật, tiệc tùng)
(4, 2), (4, 3), (4, 4), (4, 23), (4, 27), -- Bùi Văn Cường (NV VP, sạch sẽ, ít nói, sống tối giản, gym)
(5, 1), (5, 6), (5, 13), (5, 19), (5, 24), -- Hồ Quang Hiếu (Sinh viên, nấu ăn, thức khuya, chơi game, công nghệ)
(6, 2), (6, 5), (6, 3), (6, 17), (6, 25), -- Đinh Trọng Thủy (NV VP, pet, sạch sẽ, yêu động vật, nhiếp ảnh)
(7, 2), (7, 3), (7, 4), (7, 12), (7, 14), (7, 23), -- Vũ Thành Luân (NV VP, sạch sẽ, ít nói, hướng nội, dậy sớm, tối giản)
(8, 1), (8, 6), (8, 13), (8, 16), (8, 26), -- Lý Nhã Kỳ (Sinh viên, nấu ăn, thức khuya, nhậu, khách đến chơi)
(9, 5), (9, 2), (9, 13), (9, 28), (9, 29), -- Phan Văn Đức (Pet, NV VP, thức khuya, nghệ thuật, dễ tính)
(10, 2), (10, 3), (10, 6), (10, 8), (10, 9), (10, 15); -- Trương Thảo Nhi (NV VP, sạch sẽ, nấu ăn, đọc sách, nghe nhạc, k hút thuốc)


-- ============================================================
-- 10. ROOMMATE REQUESTS
-- ============================================================
INSERT INTO RoommateRequests (sender_id, receiver_id, status) VALUES
(6, 7, 'PENDING');


-- ============================================================
-- 11. SUPPORT REQUESTS
-- ============================================================
INSERT INTO SupportRequests (id, user_id, subject, message, status, resolved_by, resolved_at, response) VALUES
(1, 5, 'Lỗi đăng ảnh phòng', 'Tôi không tải được ảnh phòng lên, hệ thống báo lỗi dung lượng.', 'RESOLVED', 1, '2026-06-20 10:00:00', 'Chào bạn, hệ thống hiện tại chỉ hỗ trợ ảnh dưới 5MB. Bạn vui lòng nén ảnh lại nhé.'),
(2, 6, 'Hỏi về quy trình đặt cọc', 'Cho mình hỏi nếu mình đặt cọc qua website thì có được đảm bảo không?', 'OPEN', NULL, NULL, NULL);

INSERT INTO SupportMessages (support_request_id, sender_id, sender_role, message, created_at) VALUES
(1, 5, 'USER', 'Tôi không tải được ảnh phòng lên, hệ thống báo lỗi dung lượng.', '2026-06-19 09:00:00'),
(1, 1, 'ADMIN', 'Chào bạn, hệ thống hiện tại chỉ hỗ trợ ảnh dưới 5MB. Bạn vui lòng nén ảnh lại nhé.', '2026-06-20 10:00:00'),
(2, 6, 'USER', 'Cho mình hỏi nếu mình đặt cọc qua website thì có được đảm bảo không?', '2026-06-23 08:00:00');

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
INSERT INTO Notifications (user_id, type, reference_id, reference_type, content, is_read) VALUES
(5, 'SUPPORT', 1, 'SUPPORT', 'Yêu cầu hỗ trợ "Lỗi đăng ảnh phòng" đã được Admin phản hồi.', FALSE),
(6, 'SYSTEM', NULL, NULL, 'Chào mừng bạn đến với RoomRental!', TRUE),
(2, 'ROOM', 5, 'ROOM', 'Phòng "Phòng trọ giá rẻ trung tâm Quận 3" đang chờ duyệt.', FALSE),
(3, 'ROOM', 11, 'ROOM', 'Phòng "Studio phong cách Indochine phố cổ" đang chờ duyệt.', FALSE);

-- Cập nhật AUTO_INCREMENT thủ công nếu cần
ALTER TABLE Rooms AUTO_INCREMENT = 16;
ALTER TABLE Users AUTO_INCREMENT = 15;
