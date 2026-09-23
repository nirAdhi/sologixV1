const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requirePermission } = require('../middleware/auth');

// Shown only if the database is unreachable for a given request (no sticky flag).
const fallbackTestimonials = [
  { id:1, name:'Subhash Jha', role:'Head - Administration', company:'Ranchi Gymkhana Club', location:'Ranchi, Jharkhand', review:'Overall experience was pleasing. The company and team were customer focused throughout the installation process. I recommend this company for solar installation.', capacity:'40 kW', savings:'Rs 3,36,000/yr', rating:5, photo_url:'', is_active:1 },
  { id:2, name:'Arun K. Singh', role:'IAS - DC - Jharkhand Govt.', company:'', location:'Ranchi, Jharkhand', review:'Team Sologix have done a brilliant job. My solar system is generating perfectly. I would recommend Sologix Energy for solar installation.', capacity:'3 kW', savings:'Rs 25,200/yr', rating:5, photo_url:'', is_active:1 },
  { id:3, name:'S. Chandrashekar', role:'Chairman', company:'D.B.M.S English School', location:'Jamshedpur, Jharkhand', review:'Technically best solar team in Jharkhand. Very professional, courteous, and respectful. I recommend Sologix Energy for rooftop solar installation.', capacity:'100 kW', savings:'Rs 8,40,000/yr', rating:5, photo_url:'', is_active:1 },
];

const FIELDS = ['name', 'role', 'company', 'location', 'review', 'capacity', 'savings', 'rating', 'photo_url', 'installation_photo', 'is_active', 'sort_order'];
const MAX_IMAGE_CHARS = 1500000; // ~1.1MB decoded; the admin page resizes before upload

// Images may be an https URL, a same-site /uploads/ path, or a data: image.
const validImage = (v) => v === '' || v === null ||
  (typeof v === 'string' && v.length <= MAX_IMAGE_CHARS &&
   (/^https:\/\/[^\s"'<>]+$/i.test(v) || /^\/uploads\/[\w.-]+$/.test(v) || /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)));
const toBool = (v) => (v === undefined ? 1 : ([true, 1, '1', 'true'].includes(v) ? 1 : 0));

function clean(body, partial) {
  const out = {};
  for (const f of FIELDS) {
    if (body[f] === undefined) { if (!partial) out[f] = undefined; continue; }
    out[f] = body[f];
  }
  if (out.photo_url !== undefined && !validImage(out.photo_url)) throw Object.assign(new Error('photo_url must be an https URL, /uploads/ path or an image (max ~1MB)'), { status: 400 });
  if (out.installation_photo !== undefined && !validImage(out.installation_photo)) throw Object.assign(new Error('installation_photo must be an https URL, /uploads/ path or an image (max ~1MB)'), { status: 400 });
  if (out.rating !== undefined) {
    const r = parseInt(out.rating, 10);
    if (!(r >= 1 && r <= 5)) throw Object.assign(new Error('Rating must be 1-5'), { status: 400 });
    out.rating = r;
  }
  if (out.is_active !== undefined) out.is_active = toBool(out.is_active);
  if (out.sort_order !== undefined) out.sort_order = parseInt(out.sort_order, 10) || 0;
  return out;
}

// GET testimonials. Public: active only. ?all=true (admin page) now requires an
// admin login; previously anyone could read unpublished testimonials with it.
router.get('/', (req, res, next) => (req.query.all === 'true' ? auth(req, res, next) : next()), async (req, res) => {
  const adminMode = req.query.all === 'true';
  try {
    const q = adminMode
      ? 'SELECT * FROM testimonials ORDER BY sort_order ASC, created_at DESC'
      : 'SELECT * FROM testimonials WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC';
    const [rows] = await db.query(q);
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('Load testimonials failed:', e.code || e.message);
    if (adminMode) return res.status(500).json({ success: false, message: 'Failed to load testimonials' });
    res.json({ success: true, data: fallbackTestimonials, fallback: true });
  }
});

// POST create (admin)
router.post('/', auth, requirePermission('manage_testimonials'), async (req, res) => {
  try {
    const t = clean(req.body, false);
    if (!t.name || !t.review) return res.status(400).json({ success: false, message: 'Name and review required' });
    const [result] = await db.query(
      'INSERT INTO testimonials (name, role, company, location, review, capacity, savings, rating, photo_url, installation_photo, is_active, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
      [t.name, t.role || '', t.company || '', t.location || '', t.review, t.capacity || '', t.savings || '', t.rating || 5,
       t.photo_url || '', t.installation_photo || '', t.is_active === undefined ? 1 : t.is_active, t.sort_order || 0]
    );
    const [[row]] = await db.query('SELECT * FROM testimonials WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: row });
  } catch (e) {
    if (e.status === 400) return res.status(400).json({ success: false, message: e.message });
    console.error('Create testimonial failed:', e.code || e.message);
    res.status(500).json({ success: false, message: 'Failed to create' });
  }
});

// PUT update (admin)
router.put('/:id', auth, requirePermission('manage_testimonials'), async (req, res) => {
  try {
    const t = clean(req.body, true);
    const keys = Object.keys(t);
    if (!keys.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
    const [r] = await db.query('UPDATE testimonials SET ' + keys.map(k => k + ' = ?').join(', ') + ' WHERE id = ?', [...keys.map(k => t[k]), req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Not found' });
    const [[row]] = await db.query('SELECT * FROM testimonials WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: row });
  } catch (e) {
    if (e.status === 400) return res.status(400).json({ success: false, message: e.message });
    console.error('Update testimonial failed:', e.code || e.message);
    res.status(500).json({ success: false, message: 'Failed to update' });
  }
});

// DELETE (admin)
router.delete('/:id', auth, requirePermission('manage_testimonials'), async (req, res) => {
  try {
    const [r] = await db.query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

module.exports = router;
