const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requirePermission } = require('../middleware/auth');

// SECURITY: this endpoint is public, so only known content keys may be read or
// written. Previously every row was served to anyone and any admin could create
// arbitrary keys — and the HubSpot "save" feature was trying to store its secret
// token in this same table.
const KEYS = ['stats', 'offerings', 'why_us', 'work_process', 'social_links', 'site_theme'];

let cache = null;

// GET content settings (public)
router.get('/', async (req, res) => {
  try {
    if (cache) return res.json({ success: true, data: cache });
    const [rows] = await db.query('SELECT `key`, `value` FROM site_settings WHERE `key` IN (?)', [KEYS]);
    const data = {};
    rows.forEach(r => { try { data[r.key] = JSON.parse(r.value); } catch { data[r.key] = r.value; } });
    cache = data;
    res.json({ success: true, data });
  } catch (e) {
    console.error('Load site settings failed:', e.code || e.message);
    res.json({ success: true, data: {} });
  }
});

// PUT update a key (admin with manage_settings)
router.put('/:key', auth, requirePermission('manage_settings'), async (req, res) => {
  try {
    if (!KEYS.includes(req.params.key)) return res.status(400).json({ success: false, message: 'Unknown setting' });
    const value = JSON.stringify(req.body.value);
    if (value === undefined || value.length > 200000) return res.status(400).json({ success: false, message: 'Invalid value' });
    await db.query('INSERT INTO site_settings (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=?', [req.params.key, value, value]);
    cache = null;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

module.exports = router;
