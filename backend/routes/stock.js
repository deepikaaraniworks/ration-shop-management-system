const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireStaff } = require('../middleware/auth');

// -----------------------------------------------
// GET /api/stock/:shop_id  - Get all stock
// -----------------------------------------------
router.get('/:shop_id', authenticateToken, async (req, res) => {
  try {
    const { shop_id } = req.params;
    const [rows] = await db.execute(
      'SELECT si.*, s.name as updated_by_name FROM stock_items si LEFT JOIN staff s ON si.last_updated_by = s.id WHERE si.shop_id = ? ORDER BY si.item_name',
      [shop_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get stock error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// POST /api/stock  - Add new stock item
// -----------------------------------------------
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { shop_id, item_name, item_name_ta, item_name_hi, unit, current_quantity, minimum_threshold } = req.body;
    if (!shop_id || !item_name) {
      return res.status(400).json({ success: false, message: 'Shop ID and item name are required' });
    }

    const qty = parseFloat(current_quantity) || 0;
    const threshold = parseFloat(minimum_threshold) || 10;
    let status = 'available';
    if (qty === 0) status = 'out_of_stock';
    else if (qty <= threshold) status = 'limited';

    const [result] = await db.execute(
      'INSERT INTO stock_items (shop_id, item_name, item_name_ta, item_name_hi, unit, current_quantity, minimum_threshold, status, last_updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [shop_id, item_name, item_name_ta || '', item_name_hi || '', unit || 'kg', qty, threshold, status, req.user.id]
    );

    // Log activity
    await db.execute(
      'INSERT INTO activity_logs (staff_id, shop_id, action_type, description, new_value) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, shop_id, 'stock_add', `Added new stock item: ${item_name}`, JSON.stringify({ item_name, qty, unit })]
    );

    // Emit socket event
    if (req.io) {
      req.io.to(`shop_${shop_id}`).emit('stock_updated', { shop_id, action: 'add' });
    }

    res.status(201).json({ success: true, message: 'Stock item added successfully', id: result.insertId });
  } catch (err) {
    console.error('Add stock error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// PUT /api/stock/:id  - Update stock item
// -----------------------------------------------
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { current_quantity, minimum_threshold, status } = req.body;

    const [existing] = await db.execute('SELECT * FROM stock_items WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }

    const qty = current_quantity !== undefined ? parseFloat(current_quantity) : existing[0].current_quantity;
    const threshold = minimum_threshold !== undefined ? parseFloat(minimum_threshold) : existing[0].minimum_threshold;
    let newStatus = status || existing[0].status;
    if (current_quantity !== undefined) {
      if (qty === 0) newStatus = 'out_of_stock';
      else if (qty <= threshold) newStatus = 'limited';
      else newStatus = 'available';
    }
    if (status) newStatus = status;

    await db.execute(
      'UPDATE stock_items SET current_quantity = ?, minimum_threshold = ?, status = ?, last_updated_by = ? WHERE id = ?',
      [qty, threshold, newStatus, req.user.id, id]
    );

    // Log activity
    await db.execute(
      'INSERT INTO activity_logs (staff_id, shop_id, action_type, description, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, existing[0].shop_id, 'stock_update',
        `Updated stock: ${existing[0].item_name}`,
        JSON.stringify({ qty: existing[0].current_quantity, status: existing[0].status }),
        JSON.stringify({ qty, status: newStatus })]
    );

    // Emit socket event
    if (req.io) {
      req.io.to(`shop_${existing[0].shop_id}`).emit('stock_updated', { shop_id: existing[0].shop_id, action: 'update' });
    }

    res.json({ success: true, message: 'Stock updated successfully' });
  } catch (err) {
    console.error('Update stock error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// DELETE /api/stock/:id  - Delete stock item
// -----------------------------------------------
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.execute('SELECT * FROM stock_items WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Stock item not found' });
    }

    await db.execute('DELETE FROM stock_items WHERE id = ?', [id]);

    await db.execute(
      'INSERT INTO activity_logs (staff_id, shop_id, action_type, description) VALUES (?, ?, ?, ?)',
      [req.user.id, existing[0].shop_id, 'stock_delete', `Deleted stock item: ${existing[0].item_name}`]
    );

    if (req.io) {
      req.io.to(`shop_${existing[0].shop_id}`).emit('stock_updated', { shop_id: existing[0].shop_id, action: 'delete' });
    }

    res.json({ success: true, message: 'Stock item deleted' });
  } catch (err) {
    console.error('Delete stock error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
