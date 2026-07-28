-- ============================================================
-- RATION SHOP STOCK & NOTIFICATION MANAGEMENT SYSTEM
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS ration_system;
USE ration_system;

-- --------------------------------------------------------
-- Table: ration_shops
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS ration_shops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_code VARCHAR(20) UNIQUE NOT NULL,
  shop_name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  area VARCHAR(100),
  district VARCHAR(100),
  pincode VARCHAR(10),
  phone VARCHAR(15),
  opening_time TIME NOT NULL DEFAULT '09:00:00',
  closing_time TIME NOT NULL DEFAULT '17:00:00',
  is_open BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- Table: staff
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','staff') DEFAULT 'staff',
  shop_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES ration_shops(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- Table: beneficiaries
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS beneficiaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ration_card_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  address TEXT,
  family_members INT DEFAULT 1,
  card_type ENUM('AAY','BPL','APL','PHH') DEFAULT 'BPL',
  shop_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  otp VARCHAR(6),
  otp_expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES ration_shops(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- Table: stock_items
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  item_name_ta VARCHAR(100),
  item_name_hi VARCHAR(100),
  unit VARCHAR(20) DEFAULT 'kg',
  current_quantity DECIMAL(10,2) DEFAULT 0,
  minimum_threshold DECIMAL(10,2) DEFAULT 10,
  status ENUM('available','limited','out_of_stock') DEFAULT 'available',
  last_updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES ration_shops(id) ON DELETE CASCADE,
  FOREIGN KEY (last_updated_by) REFERENCES staff(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- Table: monthly_quota
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS monthly_quota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  item_name_ta VARCHAR(100),
  item_name_hi VARCHAR(100),
  unit VARCHAR(20) DEFAULT 'kg',
  aay_quota DECIMAL(10,2) DEFAULT 0,
  bpl_quota DECIMAL(10,2) DEFAULT 0,
  apl_quota DECIMAL(10,2) DEFAULT 0,
  phh_quota DECIMAL(10,2) DEFAULT 0,
  price_per_unit DECIMAL(10,2) DEFAULT 0,
  month INT,
  year INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES ration_shops(id) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- Table: notifications
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  shop_id INT NOT NULL,
  sent_by INT,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','warning','alert','stock','general') DEFAULT 'general',
  target_all BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES ration_shops(id) ON DELETE CASCADE,
  FOREIGN KEY (sent_by) REFERENCES staff(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- Table: notification_reads
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_reads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  notification_id INT NOT NULL,
  beneficiary_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE CASCADE,
  UNIQUE KEY unique_read (notification_id, beneficiary_id)
);

-- --------------------------------------------------------
-- Table: feedback
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  beneficiary_id INT,
  shop_id INT,
  category ENUM('complaint','suggestion','appreciation','inquiry') DEFAULT 'complaint',
  subject VARCHAR(200),
  message TEXT NOT NULL,
  status ENUM('pending','reviewed','resolved') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE SET NULL,
  FOREIGN KEY (shop_id) REFERENCES ration_shops(id) ON DELETE SET NULL
);

-- --------------------------------------------------------
-- Table: activity_logs
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  staff_id INT,
  shop_id INT,
  action_type ENUM('stock_add','stock_update','stock_delete','notification_send','shop_status_change','staff_login','staff_logout','other') NOT NULL,
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY (shop_id) REFERENCES ration_shops(id) ON DELETE SET NULL
);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

INSERT INTO ration_shops (shop_code, shop_name, address, area, district, pincode, phone, opening_time, closing_time, is_open) VALUES
('RS001', 'Anna Nagar Ration Shop', 'No.12, Main Road, Anna Nagar', 'Anna Nagar', 'Chennai', '600040', '044-23456789', '09:00:00', '17:00:00', TRUE),
('RS002', 'T.Nagar Fair Price Shop', 'No.45, Usman Road, T.Nagar', 'T.Nagar', 'Chennai', '600017', '044-28901234', '09:00:00', '17:00:00', FALSE);

-- Staff (password: Staff@123 hashed with bcrypt - stored as plain for demo, will be hashed by app)
INSERT INTO staff (staff_id, name, mobile, password, role, shop_id) VALUES
('STAFF001', 'Rajesh Kumar', '9876543210', '$2b$10$rQnJ8vJ2K3mN4oP5qR6sT.uV7wX8yZ0aB1cD2eF3gH4iJ5kL6mN7o', 'admin', 1),
('STAFF002', 'Priya Devi', '9876543211', '$2b$10$rQnJ8vJ2K3mN4oP5qR6sT.uV7wX8yZ0aB1cD2eF3gH4iJ5kL6mN7o', 'staff', 1);

-- Beneficiaries
INSERT INTO beneficiaries (ration_card_number, name, mobile, address, family_members, card_type, shop_id) VALUES
('TN1234567890', 'Murugan Selvaraj', '9123456789', 'No.5, Gandhi Street, Anna Nagar', 4, 'BPL', 1),
('TN9876543210', 'Lakshmi Devi', '9234567890', 'No.8, Nehru Road, Anna Nagar', 3, 'AAY', 1),
('TN1111222333', 'Senthil Kumar', '9345678901', 'No.12, Rajaji Avenue, Anna Nagar', 5, 'PHH', 1);

-- Stock Items
INSERT INTO stock_items (shop_id, item_name, item_name_ta, item_name_hi, unit, current_quantity, minimum_threshold, status) VALUES
(1, 'Rice', 'அரிசி', 'चावल', 'kg', 450.00, 50, 'available'),
(1, 'Wheat', 'கோதுமை', 'गेहूं', 'kg', 120.00, 30, 'limited'),
(1, 'Sugar', 'சர்க்கரை', 'चीनी', 'kg', 80.00, 20, 'available'),
(1, 'Kerosene', 'மண்ணெண்ணெய்', 'मिट्टी का तेल', 'litre', 0.00, 10, 'out_of_stock'),
(1, 'Palm Oil', 'பாமாயில்', 'पाम तेल', 'litre', 95.00, 20, 'available'),
(1, 'Dal', 'பருப்பு', 'दाल', 'kg', 25.00, 15, 'limited');

-- Monthly Quota
INSERT INTO monthly_quota (shop_id, item_name, item_name_ta, item_name_hi, unit, aay_quota, bpl_quota, apl_quota, phh_quota, price_per_unit, month, year) VALUES
(1, 'Rice', 'அரிசி', 'चावल', 'kg', 35.00, 25.00, 10.00, 25.00, 3.00, MONTH(NOW()), YEAR(NOW())),
(1, 'Wheat', 'கோதுமை', 'गेहूं', 'kg', 20.00, 15.00, 5.00, 15.00, 2.00, MONTH(NOW()), YEAR(NOW())),
(1, 'Sugar', 'சர்க்கரை', 'चीनी', 'kg', 3.00, 2.00, 1.00, 2.00, 13.50, MONTH(NOW()), YEAR(NOW())),
(1, 'Kerosene', 'மண்ணெண்ணெய்', 'मिट्टी का तेल', 'litre', 5.00, 4.00, 2.00, 4.00, 15.00, MONTH(NOW()), YEAR(NOW())),
(1, 'Palm Oil', 'பாமாயில்', 'पाम तेल', 'litre', 2.00, 1.00, 0.50, 1.00, 25.00, MONTH(NOW()), YEAR(NOW())),
(1, 'Dal', 'பருப்பு', 'दाल', 'kg', 2.00, 1.00, 0.50, 1.00, 20.00, MONTH(NOW()), YEAR(NOW()));

-- Notifications
INSERT INTO notifications (shop_id, sent_by, title, message, type) VALUES
(1, 1, 'Stock Updated', 'New rice stock has arrived. Please collect your monthly quota.', 'stock'),
(1, 1, 'Shop Holiday', 'The shop will remain closed on 15th March for maintenance.', 'alert'),
(1, 1, 'Kerosene Shortage', 'Kerosene supply is currently unavailable. Will update soon.', 'warning');

-- Sample Activity Logs (so the logs page shows data immediately)
INSERT INTO activity_logs (staff_id, shop_id, action_type, description, created_at) VALUES
(1, 1, 'staff_login', 'Rajesh Kumar logged in', NOW() - INTERVAL 1 HOUR),
(1, 1, 'stock_add', 'Added new stock item: Rice', NOW() - INTERVAL 55 MINUTE),
(1, 1, 'stock_add', 'Added new stock item: Kerosene', NOW() - INTERVAL 50 MINUTE),
(2, 1, 'stock_update', 'Updated stock: Wheat - quantity changed', NOW() - INTERVAL 2 HOUR),
(2, 1, 'stock_update', 'Updated stock: Sugar - marked as Out of Stock', NOW() - INTERVAL 1 DAY),
(1, 1, 'notification_send', 'Notification sent by Rajesh Kumar: Stock Updated', NOW() - INTERVAL 45 MINUTE),
(1, 1, 'shop_status_change', 'Shop marked as Open by Rajesh Kumar', NOW() - INTERVAL 3 HOUR),
(2, 1, 'notification_send', 'Notification sent by Priya Devi: Kerosene Available', NOW() - INTERVAL 2 DAY);
