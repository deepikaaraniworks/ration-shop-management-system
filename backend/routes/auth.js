const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Generate random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// -----------------------------------------------
// POST /api/auth/beneficiary/request-otp
// -----------------------------------------------
router.post('/beneficiary/request-otp', async (req, res) => {
  try {
    const { ration_card_number, mobile } = req.body;
    if (!ration_card_number || !mobile) {
      return res.status(400).json({ success: false, message: 'Ration card number and mobile are required' });
    }

    const [rows] = await db.execute(
      'SELECT * FROM beneficiaries WHERE ration_card_number = ? AND mobile = ? AND is_active = 1',
      [ration_card_number.toUpperCase(), mobile]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found. Check your ration card number and mobile number.' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000);

    await db.execute(
      'UPDATE beneficiaries SET otp = ?, otp_expires_at = ? WHERE id = ?',
      [otp, expiresAt, rows[0].id]
    );

    // In production, send via SMS. For demo, return OTP in response.
    console.log(`📱 OTP for ${mobile}: ${otp}`);

    res.json({
      success: true,
      message: `OTP sent to mobile number ending with ${mobile.slice(-4)}`,
      demo_otp: otp, // Remove in production
      beneficiary_name: rows[0].name
    });
  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// POST /api/auth/beneficiary/verify-otp
// -----------------------------------------------
router.post('/beneficiary/verify-otp', async (req, res) => {
  try {
    const { ration_card_number, mobile, otp } = req.body;
    if (!ration_card_number || !mobile || !otp) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const [rows] = await db.execute(
      'SELECT b.*, rs.shop_name, rs.address, rs.opening_time, rs.closing_time, rs.is_open, rs.phone as shop_phone FROM beneficiaries b LEFT JOIN ration_shops rs ON b.shop_id = rs.id WHERE b.ration_card_number = ? AND b.mobile = ? AND b.is_active = 1',
      [ration_card_number.toUpperCase(), mobile]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Beneficiary not found' });
    }

    const beneficiary = rows[0];

    if (beneficiary.otp !== otp) {
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    if (new Date() > new Date(beneficiary.otp_expires_at)) {
      return res.status(401).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Clear OTP after successful verification
    await db.execute('UPDATE beneficiaries SET otp = NULL, otp_expires_at = NULL WHERE id = ?', [beneficiary.id]);

    const token = jwt.sign(
      { id: beneficiary.id, role: 'beneficiary', shop_id: beneficiary.shop_id, name: beneficiary.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: beneficiary.id,
        name: beneficiary.name,
        ration_card_number: beneficiary.ration_card_number,
        card_type: beneficiary.card_type,
        family_members: beneficiary.family_members,
        shop_id: beneficiary.shop_id,
        shop_name: beneficiary.shop_name,
        shop_address: beneficiary.address,
        shop_opening_time: beneficiary.opening_time,
        shop_closing_time: beneficiary.closing_time,
        shop_is_open: beneficiary.is_open,
        shop_phone: beneficiary.shop_phone,
        role: 'beneficiary'
      }
    });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// POST /api/auth/staff/login
// -----------------------------------------------
router.post('/staff/login', async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: 'Mobile and password are required' });
    }

    const [rows] = await db.execute(
      'SELECT s.*, rs.shop_name, rs.address, rs.is_open, rs.opening_time, rs.closing_time FROM staff s LEFT JOIN ration_shops rs ON s.shop_id = rs.id WHERE s.mobile = ? AND s.is_active = 1',
      [mobile]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const staff = rows[0];
    const validPassword = await bcrypt.compare(password, staff.password);

    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: staff.id, role: staff.role, shop_id: staff.shop_id, name: staff.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Log activity
    await db.execute(
      'INSERT INTO activity_logs (staff_id, shop_id, action_type, description, ip_address) VALUES (?, ?, ?, ?, ?)',
      [staff.id, staff.shop_id, 'staff_login', `${staff.name} logged in`, req.ip]
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: staff.id,
        staff_id: staff.staff_id,
        name: staff.name,
        mobile: staff.mobile,
        role: staff.role,
        shop_id: staff.shop_id,
        shop_name: staff.shop_name,
        shop_address: staff.address,
        shop_is_open: staff.is_open,
        shop_opening_time: staff.opening_time,
        shop_closing_time: staff.closing_time
      }
    });
  } catch (err) {
    console.error('Staff login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// GET /api/auth/me  - Verify token and get user
// -----------------------------------------------
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
