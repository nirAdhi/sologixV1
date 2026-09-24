const express = require('express');
const { orderValidators, formLimiter } = require('../middleware/security');
const router = express.Router();
const { notifyAdminNewOrder, later } = require('../config/email');
const db = require('../config/database');
const { auth, requirePermission } = require('../middleware/auth');

const CUSTOMER_TYPES = ['customer', 'distributor', 'installer'];
const STATUSES = ['pending', 'contacted', 'confirmed', 'completed', 'cancelled'];

// POST - customer submits cart (quote request or pay-on-delivery order)
router.post('/', formLimiter, ...orderValidators, async (req, res) => {
  try {
    const { name, email, phone, address, items, notes, customer_type } = req.body;
    if (!name || !phone || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: 'Name, phone and items required' });
    }

    // BUGFIX: the product pages send customer_type 'direct_order', which the
    // ENUM column rejects under MySQL strict mode, so every Pay-on-Delivery order
    // failed. Unknown values now map to 'customer'.
    const ctype = CUSTOMER_TYPES.includes(customer_type) ? customer_type : 'customer';

    // Rebuild items from the catalog: only id + qty come from the client, so
    // staff never quote from prices or names typed into the request.
    const wanted = items.map(i => ({ id: parseInt(i.id, 10), qty: parseInt(i.qty, 10) }))
      .filter(i => Number.isInteger(i.id) && i.id > 0 && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 10000);
    if (!wanted.length) return res.status(400).json({ success: false, message: 'Invalid items' });
    const [rows] = await db.query('SELECT id, brand, model, unit FROM product_catalog WHERE id IN (?)', [[...new Set(wanted.map(i => i.id))]]);
    const byId = new Map(rows.map(r => [r.id, r]));
    const basket = wanted.filter(w => byId.has(w.id)).map(w => ({ ...byId.get(w.id), qty: w.qty }));
    if (!basket.length) return res.status(400).json({ success: false, message: 'Those products are no longer available' });

    const [r] = await db.query(
      'INSERT INTO product_orders (name,email,phone,address,items,notes,customer_type,status) VALUES (?,?,?,?,?,?,?,?)',
      [String(name).slice(0, 255), email || '', String(phone).slice(0, 20), address || '', JSON.stringify(basket),
       String(notes || '').slice(0, 2000), ctype, 'pending']
    );
    res.status(201).json({ success: true, message: 'Order received', data: { id: r.insertId } });
    later(notifyAdminNewOrder, { name, email, phone, address, items: basket, payment_method: 'Pay on Delivery / quote' });
  } catch (e) {
    // Previously answered 201 "received" even when nothing was saved.
    console.error('Product order save failed:', e.code || e.message);
    res.status(503).json({ success: false, message: 'We could not save your order right now. Please call us.' });
  }
});

// GET all orders (admin)
router.get('/', auth, requirePermission('manage_bookings'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM product_orders ORDER BY created_at DESC LIMIT 1000');
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('Load orders failed:', e.message);
    res.status(500).json({ success: false, message: 'Failed to load orders' });
  }
});

router.put('/:id/status', auth, requirePermission('manage_bookings'), async (req, res) => {
  try {
    if (!STATUSES.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const [r] = await db.query('UPDATE product_orders SET status=? WHERE id=?', [req.body.status, req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

module.exports = router;
