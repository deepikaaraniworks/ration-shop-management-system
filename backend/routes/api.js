const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireStaff } = require('../middleware/auth');

// -----------------------------------------------
// SHOP ROUTES
// -----------------------------------------------

// GET /api/shop/:id
router.get('/shop/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM ration_shops WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Shop not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/shop/:id/status  - Toggle shop open/close
router.put('/shop/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { is_open } = req.body;
    const [existing] = await db.execute('SELECT * FROM ration_shops WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Shop not found' });

    await db.execute('UPDATE ration_shops SET is_open = ? WHERE id = ?', [is_open, req.params.id]);

    await db.execute(
      'INSERT INTO activity_logs (staff_id, shop_id, action_type, description, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, req.params.id, 'shop_status_change',
        `Shop marked as ${is_open ? 'Open' : 'Closed'} by ${req.user.name}`,
        JSON.stringify({ is_open: existing[0].is_open }),
        JSON.stringify({ is_open })]
    );

    if (req.io) {
      req.io.to(`shop_${req.params.id}`).emit('shop_status_changed', { shop_id: req.params.id, is_open });
    }

    res.json({ success: true, message: `Shop is now ${is_open ? 'Open' : 'Closed'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// NOTIFICATIONS ROUTES
// -----------------------------------------------

// GET /api/notifications/:shop_id
router.get('/notifications/:shop_id', authenticateToken, async (req, res) => {
  try {
    const { shop_id } = req.params;
    const beneficiary_id = req.user.role === 'beneficiary' ? req.user.id : null;

    let query = 'SELECT n.*, s.name as sent_by_name FROM notifications n LEFT JOIN staff s ON n.sent_by = s.id WHERE n.shop_id = ? ORDER BY n.created_at DESC LIMIT 50';
    const [rows] = await db.execute(query, [shop_id]);

    // Mark as read if beneficiary
    if (beneficiary_id && rows.length > 0) {
      const ids = rows.map(r => r.id);
      for (const nid of ids) {
        await db.execute(
          'INSERT IGNORE INTO notification_reads (notification_id, beneficiary_id) VALUES (?, ?)',
          [nid, beneficiary_id]
        );
      }
    }

    // Get unread count for beneficiary
    let unread_count = 0;
    if (beneficiary_id) {
      const [unread] = await db.execute(
        'SELECT COUNT(*) as count FROM notifications n WHERE n.shop_id = ? AND n.id NOT IN (SELECT notification_id FROM notification_reads WHERE beneficiary_id = ?)',
        [shop_id, beneficiary_id]
      );
      unread_count = unread[0].count;
    }

    res.json({ success: true, data: rows, unread_count });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/notifications  - Send notification
router.post('/notifications', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { shop_id, title, message, type } = req.body;
    if (!shop_id || !title || !message) {
      return res.status(400).json({ success: false, message: 'Shop ID, title and message are required' });
    }

    const [result] = await db.execute(
      'INSERT INTO notifications (shop_id, sent_by, title, message, type) VALUES (?, ?, ?, ?, ?)',
      [shop_id, req.user.id, title, message, type || 'general']
    );

    await db.execute(
      'INSERT INTO activity_logs (staff_id, shop_id, action_type, description) VALUES (?, ?, ?, ?)',
      [req.user.id, shop_id, 'notification_send', `Notification sent by ${req.user.name}: ${title}`]
    );

    if (req.io) {
      req.io.to(`shop_${shop_id}`).emit('new_notification', { shop_id, title, message, type, id: result.insertId });
    }

    res.status(201).json({ success: true, message: 'Notification sent successfully', id: result.insertId });
  } catch (err) {
    console.error('Send notification error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/notifications/:id
router.delete('/notifications/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    await db.execute('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// MONTHLY QUOTA ROUTES
// -----------------------------------------------

// GET /api/quota/:shop_id
router.get('/quota/:shop_id', authenticateToken, async (req, res) => {
  try {
    const { shop_id } = req.params;
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();

    const [rows] = await db.execute(
      'SELECT * FROM monthly_quota WHERE shop_id = ? AND month = ? AND year = ? ORDER BY item_name',
      [shop_id, month, year]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/quota  - Set monthly quota
router.post('/quota', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { shop_id, item_name, item_name_ta, item_name_hi, unit, aay_quota, bpl_quota, apl_quota, phh_quota, price_per_unit, month, year } = req.body;

    const [existing] = await db.execute(
      'SELECT id FROM monthly_quota WHERE shop_id = ? AND item_name = ? AND month = ? AND year = ?',
      [shop_id, item_name, month, year]
    );

    if (existing.length > 0) {
      await db.execute(
        'UPDATE monthly_quota SET aay_quota=?, bpl_quota=?, apl_quota=?, phh_quota=?, price_per_unit=? WHERE id=?',
        [aay_quota, bpl_quota, apl_quota, phh_quota, price_per_unit, existing[0].id]
      );
    } else {
      await db.execute(
        'INSERT INTO monthly_quota (shop_id, item_name, item_name_ta, item_name_hi, unit, aay_quota, bpl_quota, apl_quota, phh_quota, price_per_unit, month, year) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [shop_id, item_name, item_name_ta || '', item_name_hi || '', unit || 'kg', aay_quota, bpl_quota, apl_quota, phh_quota, price_per_unit, month, year]
      );
    }
    res.json({ success: true, message: 'Quota updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// FEEDBACK ROUTES
// -----------------------------------------------

// GET /api/feedback/:shop_id  - For staff
router.get('/feedback/:shop_id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT f.*, b.name as beneficiary_name, b.ration_card_number FROM feedback f LEFT JOIN beneficiaries b ON f.beneficiary_id = b.id WHERE f.shop_id = ? ORDER BY f.created_at DESC',
      [req.params.shop_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/feedback  - Submit feedback
router.post('/feedback', authenticateToken, async (req, res) => {
  try {
    const { shop_id, category, subject, message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const beneficiary_id = req.user.role === 'beneficiary' ? req.user.id : null;

    await db.execute(
      'INSERT INTO feedback (beneficiary_id, shop_id, category, subject, message) VALUES (?, ?, ?, ?, ?)',
      [beneficiary_id, shop_id || req.user.shop_id, category || 'complaint', subject || '', message]
    );

    res.status(201).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/feedback/:id/status  - Update feedback status
router.put('/feedback/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE feedback SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: 'Feedback status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// ACTIVITY LOGS
// -----------------------------------------------

// GET /api/logs/:shop_id
router.get('/logs/:shop_id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const [rows] = await db.execute(
      'SELECT al.*, s.name as staff_name FROM activity_logs al LEFT JOIN staff s ON al.staff_id = s.id WHERE al.shop_id = ? ORDER BY al.created_at DESC LIMIT ? OFFSET ?',
      [req.params.shop_id, parseInt(limit), parseInt(offset)]
    );

    const [count] = await db.execute('SELECT COUNT(*) as total FROM activity_logs WHERE shop_id = ?', [req.params.shop_id]);

    res.json({ success: true, data: rows, total: count[0].total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// BENEFICIARIES (staff view)
// -----------------------------------------------
router.get('/beneficiaries/:shop_id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, ration_card_number, name, mobile, family_members, card_type, is_active, created_at FROM beneficiaries WHERE shop_id = ? ORDER BY name',
      [req.params.shop_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
