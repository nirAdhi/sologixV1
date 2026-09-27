// Public site details (from .env) and the admin "Email & Integrations" API.
const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../config/database');
const { auth, requirePermission } = require('../middleware/auth');
const { publicConfig, integrationStatus } = require('../config/siteConfig');
const email = require('../config/email');

const publicRouter = express.Router();
const adminRouter = express.Router();

// ---- public: contact numbers, WhatsApp, social links -----------------------
let cache = null;
let cacheAt = 0;
async function adminSocialLinks() {
  try {
    const [rows] = await db.query("SELECT `value` FROM site_settings WHERE `key` = 'social_links'");
    return rows.length ? (JSON.parse(rows[0].value) || {}) : {};
  } catch (e) { return {}; }
}
publicRouter.get('/public', async (req, res) => {
  if (!cache || Date.now() - cacheAt > 60000) {
    cache = publicConfig(await adminSocialLinks());
    cacheAt = Date.now();
  }
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ success: true, data: cache });
});
publicRouter.clearCache = () => { cache = null; };

// ---- admin: email settings, test, integrations ----------------------------
const canManage = [auth, requirePermission('manage_settings')];
const testLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many test emails. Please wait a few minutes.' } });

adminRouter.get('/', ...canManage, async (req, res) => {
  const status = await email.status();
  const integrations = integrationStatus();
  // integrationStatus() only knows about .env; reflect an admin-panel SMTP too.
  if (integrations.email) integrations.email.configured = status.configured;
  res.json({ success: true, data: { status, settings: await email.getSettings(), integrations } });
});

// Save the SMTP connection from the admin panel (empty password = keep saved one).
adminRouter.put('/smtp', ...canManage, async (req, res) => {
  try {
    await email.saveSmtp(req.body || {});
    res.json({ success: true, message: 'SMTP connection saved. Use "Check connection" to test the login.', data: { status: await email.status() } });
  } catch (e) {
    if (e.status === 400) return res.status(400).json({ success: false, message: e.message });
    console.error('Save SMTP failed:', e.message);
    res.status(500).json({ success: false, message: 'Could not save the SMTP connection' });
  }
});

// Forget the admin-panel SMTP and fall back to the server's .env values.
adminRouter.delete('/smtp', ...canManage, async (req, res) => {
  try {
    await email.clearSmtp();
    res.json({ success: true, message: 'Removed. The server now uses the SMTP values from .env (if any).', data: { status: await email.status() } });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Could not remove the saved connection' });
  }
});

adminRouter.put('/settings', ...canManage, async (req, res) => {
  try {
    const settings = await email.saveSettings(req.body || {});
    res.json({ success: true, data: settings, message: 'Email settings saved' });
  } catch (e) {
    if (e.status === 400) return res.status(400).json({ success: false, message: e.message });
    console.error('Save email settings failed:', e.message);
    res.status(500).json({ success: false, message: 'Could not save email settings' });
  }
});

adminRouter.post('/verify', ...canManage, testLimiter, async (req, res) => {
  const r = await email.verifyConnection();
  res.status(r.ok ? 200 : 400).json({ success: r.ok, message: r.ok ? 'Connected to the mail server and logged in successfully.' : `Could not connect: ${r.error}` });
});

adminRouter.post('/test', ...canManage, testLimiter, async (req, res) => {
  const to = String((req.body && req.body.to) || '').trim();
  if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(to)) return res.status(400).json({ success: false, message: 'Enter one valid email address' });
  try {
    await email.sendTestEmail(to);
    res.json({ success: true, message: `Test email sent to ${to}. Check the inbox (and spam folder).` });
  } catch (e) {
    res.status(e.status === 400 ? 400 : 502).json({ success: false, message: e.status === 400 ? e.message : `Sending failed: ${e.message}` });
  }
});

module.exports = { publicRouter, adminRouter };
