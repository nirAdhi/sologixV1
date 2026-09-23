const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

let cache = null;

// GET all settings (public)
router.get('/', async (req, res) => {
  try {
    if (cache) return res.json({ success: true, data: cache });
    const [rows] = await db.query('SELECT `key`, `value` FROM site_settings');
    const data = {};
    rows.forEach(r => { try { data[r.key] = JSON.parse(r.value); } catch { data[r.key] = r.value; }});
    cache = data;
    res.json({ success: true, data });
  } catch (e) {
    res.json({ success: true, data: {} });
  }
});

// PUT update a key (admin)
router.put('/:key', auth, async (req, res) => {
  try {
    const value = JSON.stringify(req.body.value);
    await db.query('INSERT INTO site_settings (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=?', [req.params.key, value, value]);
    cache = null;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

module.exports = router;
