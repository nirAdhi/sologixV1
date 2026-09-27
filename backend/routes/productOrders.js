const express = require('express');
const { orderValidators, formLimiter } = require('../middleware/security');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { notifyAdminNewOrder, sendOrderStatusUpdate, later } = require('../config/email');
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
    // "We received your order" confirmation to the customer (when they gave an email)
    later(sendOrderStatusUpdate, { id: r.insertId, name, email, items: basket, status: 'pending' });
  } catch (e) {
    // Previously answered 201 "received" even when nothing was saved.
    console.error('Product order save failed:', e.code || e.message);
    res.status(503).json({ success: false, message: 'We could not save your order right now. Please call us.' });
  }
});

// Public "track my order": needs the order number AND the phone it was placed
// with, so an order number alone reveals nothing. Rate limited against guessing.
const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, message: 'Too many lookups, please try again later.' },
  standardHeaders: true, legacyHeaders: false,
});
router.get('/track', trackLimiter, async (req, res) => {
  try {
    const id = parseInt(req.query.id, 10);
    const phone = String(req.query.phone || '').replace(/\D/g, '');
    if (!Number.isInteger(id) || id < 1 || phone.length < 10) {
      return res.status(400).json({ success: false, message: 'Enter the order number and the phone number used for the order' });
    }
    const [rows] = await db.query('SELECT id, items, status, amount, created_at, phone FROM product_orders WHERE id = ? LIMIT 1', [id]);
    const o = rows[0];
    const digits = (s) => String(s || '').replace(/\D/g, '');
    if (!o || digits(o.phone).slice(-10) !== phone.slice(-10)) {
      return res.status(404).json({ success: false, message: 'No order found for that order number and phone' });
    }
    let items = [];
    try { items = JSON.parse(o.items) || []; } catch (e) { items = []; }
    res.json({
      success: true,
      data: {
        id: o.id,
        status: o.status,
        created_at: o.created_at,
        amount: o.amount,
        items: items.map(i => ({ brand: i.brand, model: i.model, qty: i.qty || i.quantity || 1, unit: i.unit })),
      },
    });
  } catch (e) {
    console.error('Order track failed:', e.code || e.message);
    res.status(500).json({ success: false, message: 'Could not look up the order right now' });
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
    // Let the customer know (Admin > Email > "status updates to the customer").
    db.query('SELECT id, name, email, items, status FROM product_orders WHERE id = ?', [req.params.id])
      .then(([[o]]) => { if (o) later(sendOrderStatusUpdate, o); }).catch(() => {});
  } catch (e) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

module.exports = router;
