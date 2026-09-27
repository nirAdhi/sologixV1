const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requirePermission } = require('../middleware/auth');

// Shown only if the DB is unreachable for that request (no sticky global flag).
const staticProjects = [
  { id:1, title:'Ranchi Gymkhana Club', location:'Ranchi, Jharkhand', capacity:'40 kW', type:'Commercial', description:'On-grid solar installation for Ranchi\'s premier gymkhana club.', image_url:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop', savings:'Rs 3,36,000/yr', is_featured:1, sort_order:1 },
  { id:2, title:'DBMS English School', location:'Jamshedpur, Jharkhand', capacity:'100 kW', type:'Institutional', description:'Large-scale solar installation for a leading English medium school.', image_url:'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=400&fit=crop', savings:'Rs 8,40,000/yr', is_featured:1, sort_order:2 },
  { id:3, title:'Raj Ceramics', location:'Hardag, Ranchi', capacity:'55 kW', type:'Industrial', description:'Industrial rooftop solar for ceramics manufacturing unit.', image_url:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop', savings:'Rs 4,20,000/yr', is_featured:1, sort_order:3 },
  { id:4, title:'CMS Kerala Bhavan', location:'Pune, Maharashtra', capacity:'30 kW', type:'Commercial', description:'Commercial solar installation achieving near-zero electricity bills.', image_url:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=400&fit=crop', savings:'Rs 6,30,000/yr', is_featured:1, sort_order:4 },
  { id:5, title:'Dayanand Public School', location:'Jamshedpur, Jharkhand', capacity:'40 kW', type:'Institutional', description:'Complete solar EPC solution for prominent public school.', image_url:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=600&h=400&fit=crop', savings:'Rs 3,36,000/yr', is_featured:1, sort_order:5 },
  { id:6, title:'Solar Mini Grid', location:'Chatra, Jharkhand', capacity:'25 kW', type:'Industrial', description:'Off-grid solar mini grid providing power to rural community.', image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=400&fit=crop', savings:'Rs 2,10,000/yr', is_featured:0, sort_order:6 },
];

const canManage = [auth, requirePermission('manage_services')]; // matches the admin menu permission

// Gallery: up to 12 https links (photos, YouTube, or video files) as a JSON array.
// Returns the JSON string to store, '' to clear, or undefined when not sent.
function normalizeGallery(v) {
  if (v === undefined) return undefined;
  const arr = (Array.isArray(v) ? v : String(v || '').split(/\r?\n/))
    .map((x) => String(x || '').trim()).filter(Boolean);
  if (!arr.length) return '';
  if (arr.length > 12) throw Object.assign(new Error('Gallery: at most 12 links'), { status: 400 });
  for (const u of arr) {
    if (u.length > 500 || !/^https:\/\/[^\s"'<>]+$/i.test(u)) {
      throw Object.assign(new Error('Every gallery entry must be an https:// link'), { status: 400 });
    }
  }
  return JSON.stringify(arr);
}
const validImage = (v) => v === undefined || v === '' || (typeof v === 'string' && v.length <= 1500000 &&
  (/^https:\/\/[^\s"'<>]+$/i.test(v) || /^\/uploads\/[\w.-]+$/.test(v) || /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)));

// A brand-new database gets the six classic projects once, so the homepage,
// Projects page and Gallery are never empty on a fresh install. All of them
// are ordinary rows the admin can edit or delete afterwards (same pattern as
// the product catalog seed).
let seeded = false;
const seed = async () => {
  if (seeded) return;
  try {
    const [[{ c }]] = await db.query('SELECT COUNT(*) AS c FROM projects');
    if (Number(c) === 0) {
      for (const p of staticProjects) {
        await db.query(
          'INSERT INTO projects (title, location, capacity, type, description, image_url, savings, is_featured, sort_order) VALUES (?,?,?,?,?,?,?,?,?)',
          [p.title, p.location, p.capacity, p.type, p.description, p.image_url, p.savings, p.is_featured, p.sort_order]
        );
      }
      console.log('Projects seeded (fresh database)');
    }
    seeded = true;
  } catch (e) { console.error('Project seed failed:', e.code || e.message); }
};

router.get('/', async (req, res) => {
  await seed();
  try {
    const featured = req.query.featured === 'true';
    const milestones = req.query.milestones === 'true';
    const q = milestones ? 'SELECT * FROM projects WHERE is_milestone=1 ORDER BY sort_order ASC LIMIT 12'
      : featured ? 'SELECT * FROM projects WHERE is_featured=1 ORDER BY sort_order ASC LIMIT 6'
      : 'SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC';
    const [rows] = await db.query(q);
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('Load projects failed:', e.code || e.message);
    res.json({ success: true, data: staticProjects, fallback: true });
  }
});

router.post('/', ...canManage, async (req, res) => {
  try {
    const { title, location, capacity, type, description, image_url, savings, is_featured, sort_order, is_milestone, completed_on, video_url } = req.body;
    let gallery; try { gallery = normalizeGallery(req.body.gallery); } catch (ge) { return res.status(400).json({ success: false, message: ge.message }); }
    if (!title) return res.status(400).json({ success: false, message: 'Title required' });
    if (!validImage(image_url)) return res.status(400).json({ success: false, message: 'image_url must be an https URL, /uploads/ path or image' });
    if (video_url !== undefined && video_url !== '' && video_url !== null && !/^https:\/\/[^\s"'<>]+$/i.test(String(video_url))) {
      return res.status(400).json({ success: false, message: 'video_url must be an https:// link' });
    }
    const [r] = await db.query('INSERT INTO projects (title, location, capacity, type, description, image_url, savings, is_featured, sort_order, is_milestone, completed_on, video_url, gallery) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [title, location||'', capacity||'', type||'Residential', description||'', image_url||'', savings||'', is_featured?1:0, sort_order||0, is_milestone?1:0, String(completed_on||'').slice(0,30)||null, String(video_url||'').slice(0,500)||null, gallery||null]);
    const [[p]] = await db.query('SELECT * FROM projects WHERE id=?', [r.insertId]);
    res.status(201).json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

router.put('/:id', ...canManage, async (req, res) => {
  try {
    if (!validImage(req.body.image_url)) return res.status(400).json({ success: false, message: 'image_url must be an https URL, /uploads/ path or image' });
    if (req.body.video_url !== undefined && req.body.video_url !== '' && req.body.video_url !== null && !/^https:\/\/[^\s"'<>]+$/i.test(String(req.body.video_url))) return res.status(400).json({ success: false, message: 'video_url must be an https:// link' });
    try { const g = normalizeGallery(req.body.gallery); if (g !== undefined) req.body.gallery = g; } catch (ge) { return res.status(400).json({ success: false, message: ge.message }); }
    const fields = ['title','location','capacity','type','description','image_url','savings','is_featured','sort_order','is_milestone','completed_on','video_url','gallery'];
    const updates = []; const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(f+'=?'); params.push(req.body[f]); }});
    if (!updates.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
    params.push(req.params.id);
    await db.query('UPDATE projects SET '+updates.join(',')+' WHERE id=?', params);
    const [[p]] = await db.query('SELECT * FROM projects WHERE id=?', [req.params.id]);
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

router.delete('/:id', ...canManage, async (req, res) => {
  try { await db.query('DELETE FROM projects WHERE id=?', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

module.exports = router;
