// First-party footfall tracking. The public site POSTs one small event per page
// view — only after the visitor accepted analytics cookies (CookieConsent.js).
// No PII is stored: `visitor` is a random id generated in the visitor's own
// browser, and the referrer is reduced to a hostname. Admins read the numbers
// on Admin > Analytics (routes/analytics.js).
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const db = require('../config/database');

const trackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,   // a human clicking around, not a flood
  message: { success: false },
  standardHeaders: false, legacyHeaders: false,
});

const DEVICES = ['mobile', 'tablet', 'desktop'];
const PATH_RE = /^\/[\w\-./%]{0,200}$/;          // pathname only, no query string
const VISITOR_RE = /^[a-f0-9]{16,32}$/;

router.post('/', trackLimiter, async (req, res) => {
  // Always answer 204 quickly; analytics must never break or slow the site.
  res.status(204).end();
  try {
    const b = req.body || {};
    const path = typeof b.path === 'string' && PATH_RE.test(b.path) ? b.path : null;
    const visitor = typeof b.visitor === 'string' && VISITOR_RE.test(b.visitor) ? b.visitor : null;
    if (!path || !visitor) return;
    let referrer = '';
    if (typeof b.referrer === 'string' && b.referrer) {
      try { referrer = new URL(b.referrer).hostname.slice(0, 200); } catch (e) { referrer = ''; }
    }
    const device = DEVICES.includes(b.device) ? b.device : '';
    const lang = typeof b.lang === 'string' && /^[a-z]{2}$/i.test(b.lang) ? b.lang.toLowerCase() : '';
    await db.query(
      'INSERT INTO site_visits (event, path, referrer, visitor, device, lang) VALUES (?,?,?,?,?,?)',
      ['pageview', path, referrer, visitor, device, lang]
    );
  } catch (e) { /* never surface tracking errors */ }
});

// Fire-and-forget login counter used by the admin/customer login routes.
const logEvent = (event) => {
  db.query('INSERT INTO site_visits (event) VALUES (?)', [event]).catch(() => {});
};

// Retention: analytics rows older than 180 days are pruned once a day, so the
// table can't grow without bound (and old visit data doesn't linger forever).
const prune = () => {
  db.query("DELETE FROM site_visits WHERE created_at < DATE_SUB(NOW(), INTERVAL 180 DAY)").catch(() => {});
};
setTimeout(prune, 60 * 1000).unref?.();
setInterval(prune, 24 * 60 * 60 * 1000).unref?.();

module.exports = router;
module.exports.logEvent = logEvent;
