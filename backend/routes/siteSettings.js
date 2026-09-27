const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requirePermission } = require('../middleware/auth');
const { normalizeSection } = require('../services/youtube');

// SECURITY: this endpoint is public, so only known content keys may be read or
// written, and every value is checked/cleaned before it is stored so the
// homepage can never be broken by a malformed save.
const KEYS = ['stats', 'offerings', 'why_us', 'work_process', 'social_links', 'site_theme', 'youtube_section', 'tracking', 'capture', 'promo_banner', 'branches', 'channel_partners'];
const MAX_BYTES = { offerings: 3000000 };           // offerings may carry uploaded images
const DEFAULT_MAX_BYTES = 200000;

const bad = (msg) => Object.assign(new Error(msg), { status: 400 });
const str = (v, max) => (v === undefined || v === null ? '' : String(v)).trim().slice(0, max);
const IMG_RE = /^(https:\/\/[^\s"'<>]+|\/uploads\/[\w.-]+|data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+)$/i;
const img = (v) => { const s = str(v, 1600000); if (s && !IMG_RE.test(s)) throw bad('Images must be an https:// link, an uploaded image or a /uploads/ file'); return s; };
const link = (v, dflt) => { const s = str(v, 500); if (!s) return dflt; if (/^\/(?!\/)[^\s"'<>]*$/.test(s) || /^https:\/\/[^\s"'<>]+$/i.test(s)) return s; throw bad('Links must start with / (a page on this site) or https://'); };
const list = (value, name, mapItem, max = 30) => {
  if (!Array.isArray(value)) throw bad(`${name} must be a list`);
  if (value.length > max) throw bad(`${name}: at most ${max} items`);
  return value.map((it, i) => {
    if (!it || typeof it !== 'object' || Array.isArray(it)) throw bad(`${name}: item ${i + 1} is not valid`);
    return mapItem(it, i);
  });
};
const SITE_THEMES = ['emerald', 'ocean', 'forest', 'sunset', 'violet', 'slate']; // must match frontend ThemeProvider SITE_THEMES
const bool = (v) => v === true || v === 'true' || v === 1 || v === '1';

const NORMALIZE = {
  stats: (v) => list(v, 'Stats', (it) => {
    const label = str(it.label, 80); if (!label) throw bad('Every stat needs a label');
    const out = { target: str(it.target, 20), suffix: str(it.suffix, 20), label };
    if (it.decimals !== undefined && it.decimals !== '') out.decimals = Math.min(3, Math.max(0, parseInt(it.decimals, 10) || 0));
    return out;
  }, 12),
  offerings: (v) => list(v, 'Offerings', (it) => {
    const label = str(it.label, 80); if (!label) throw bad('Every offering needs a title');
    return { label, desc: str(it.desc, 400), img: img(it.img), link: link(it.link, '/solutions') };
  }, 12),
  why_us: (v) => list(v, 'Why choose us', (it) => {
    const title = str(it.title, 100); if (!title) throw bad('Every "why choose us" card needs a title');
    return { icon: str(it.icon, 16), title, desc: str(it.desc, 400) };
  }, 16),
  work_process: (v) => list(v, 'Work process', (it, i) => {
    const title = str(it.title, 100); if (!title) throw bad('Every step needs a title');
    return { num: str(it.num, 6) || String(i + 1).padStart(2, '0'), title, desc: str(it.desc, 600), icon: str(it.icon, 16) };
  }, 12),
  social_links: (v) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw bad('Social links must be an object');
    const out = {};
    for (const k of ['youtube', 'facebook', 'instagram', 'linkedin', 'x', 'whatsapp']) {
      if (v[k] === undefined) continue;
      const s = str(v[k], 500);
      if (s && !/^https:\/\/[^\s"'<>]+$/i.test(s)) throw bad(`The ${k} link must start with https://`);
      out[k] = s;
    }
    return out;
  },
  site_theme: (v) => { const s = str(v, 40); if (!SITE_THEMES.includes(s)) throw bad('Unknown theme'); return s; },
  youtube_section: (v) => normalizeSection(v),
  tracking: (v) => {
    const o = v && typeof v === 'object' ? v : {};
    const ga4 = str(o.ga4_id, 20).toUpperCase();
    const clarity = str(o.clarity_id, 20);
    if (ga4 && !/^G-[A-Z0-9]{4,12}$/.test(ga4)) throw bad('Google Analytics ID must look like G-XXXXXXX');
    if (clarity && !/^[a-z0-9]{6,20}$/i.test(clarity)) throw bad('Clarity ID must be 6–20 letters/numbers');
    return { ga4_id: ga4, clarity_id: clarity };
  },
  channel_partners: (v) => {
    if (!Array.isArray(v)) throw bad('Channel partners must be a list');
    if (v.length > 12) throw bad('Channel partners: at most 12 brands');
    const out = v.map((x) => str(x, 40)).filter(Boolean);
    return out;
  },
  branches: (v) => list(v, 'Branches', (it) => {
    const name = str(it.name, 80); if (!name) throw bad('Every branch needs a name (e.g. "Jamshedpur Branch")');
    const address = str(it.address, 300);
    let phones = Array.isArray(it.phones) ? it.phones : [];
    phones = phones.map((p) => str(p, 90)).filter(Boolean).slice(0, 5);
    return { name, address, phones };
  }, 12),
  promo_banner: (v) => {
    const o = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    const THEMES = ['diwali', 'navratri', 'green'];
    const date = (x, name) => {
      const s = str(x, 10);
      if (!s) return '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) throw bad(`${name} must be a date like 2026-11-08`);
      return s;
    };
    const start = date(o.start_date, 'The start date');
    const end = date(o.end_date, 'The end date');
    if (start && end && start > end) throw bad('The banner end date is before its start date');
    const out = {
      enabled: bool(o.enabled),
      heading: str(o.heading, 100),
      subheading: str(o.subheading, 250),
      cta_text: str(o.cta_text, 40),
      cta_link: link(o.cta_link, '/booking'),
      coupon: str(o.coupon, 30),
      theme: THEMES.includes(str(o.theme, 20)) ? str(o.theme, 20) : 'diwali',
      start_date: start,
      end_date: end,
      show_countdown: bool(o.show_countdown),
    };
    if (out.enabled && !out.heading) throw bad('The banner needs a heading');
    return out;
  },
  capture: (v) => {
    const o = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    const tidio = str(o.tidio_key, 40);
    if (tidio && !/^[a-z0-9]{20,40}$/i.test(tidio)) throw bad('Tidio key must be 20–40 letters/numbers');
    const delay = parseInt(o.delay_seconds, 10);
    return {
      exit_intent_enabled: bool(o.exit_intent_enabled),
      timed_popup_enabled: bool(o.timed_popup_enabled),
      delay_seconds: delay >= 5 && delay <= 300 ? delay : 30,
      popup_heading: str(o.popup_heading, 120),
      popup_subheading: str(o.popup_subheading, 250),
      popup_button_text: str(o.popup_button_text, 40),
      live_chat_enabled: bool(o.live_chat_enabled),
      tidio_key: tidio,
    };
  },
};

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
    // Tell the pages this is a failure (not "nothing saved") so they use built-in content.
    res.status(503).json({ success: false, data: {}, message: 'Settings temporarily unavailable' });
  }
});

// PUT update a key (admin with manage_settings)
router.put('/:key', auth, requirePermission('manage_settings'), async (req, res) => {
  try {
    const key = req.params.key;
    if (!KEYS.includes(key)) return res.status(400).json({ success: false, message: 'Unknown setting' });
    if (req.body.value === undefined) return res.status(400).json({ success: false, message: 'Invalid value' });
    const clean = NORMALIZE[key](req.body.value);
    const value = JSON.stringify(clean);
    if (value.length > (MAX_BYTES[key] || DEFAULT_MAX_BYTES)) {
      return res.status(400).json({ success: false, message: 'This section is too large. Use image links or upload fewer/smaller images.' });
    }
    await db.query('INSERT INTO site_settings (`key`, `value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=?', [key, value, value]);
    cache = null;
    try { require('./config').publicRouter.clearCache(); } catch (e) { /* ignore */ }
    res.json({ success: true, data: clean });
  } catch (e) {
    if (e.status === 400) return res.status(400).json({ success: false, message: e.message });
    console.error('Save site setting failed:', e.code || e.message);
    res.status(500).json({ success: false, message: 'Could not save. Please try again.' });
  }
});

module.exports = router;
