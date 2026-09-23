const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

let useStatic = false;
const staticProjects = [
  { id:1, title:'Ranchi Gymkhana Club', location:'Ranchi, Jharkhand', capacity:'40 kW', type:'Commercial', description:'On-grid solar installation for Ranchi\'s premier gymkhana club.', image_url:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop', savings:'Rs 3,36,000/yr', is_featured:1, sort_order:1 },
  { id:2, title:'DBMS English School', location:'Jamshedpur, Jharkhand', capacity:'100 kW', type:'Institutional', description:'Large-scale solar installation for a leading English medium school.', image_url:'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=400&fit=crop', savings:'Rs 8,40,000/yr', is_featured:1, sort_order:2 },
  { id:3, title:'Raj Ceramics', location:'Hardag, Ranchi', capacity:'55 kW', type:'Industrial', description:'Industrial rooftop solar for ceramics manufacturing unit.', image_url:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop', savings:'Rs 4,20,000/yr', is_featured:1, sort_order:3 },
  { id:4, title:'CMS Kerala Bhavan', location:'Pune, Maharashtra', capacity:'30 kW', type:'Commercial', description:'Commercial solar installation achieving near-zero electricity bills.', image_url:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=400&fit=crop', savings:'Rs 6,30,000/yr', is_featured:1, sort_order:4 },
  { id:5, title:'Dayanand Public School', location:'Jamshedpur, Jharkhand', capacity:'40 kW', type:'Institutional', description:'Complete solar EPC solution for prominent public school.', image_url:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=600&h=400&fit=crop', savings:'Rs 3,36,000/yr', is_featured:1, sort_order:5 },
  { id:6, title:'Solar Mini Grid', location:'Chatra, Jharkhand', capacity:'25 kW', type:'Industrial', description:'Off-grid solar mini grid providing power to rural community.', image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=400&fit=crop', savings:'Rs 2,10,000/yr', is_featured:0, sort_order:6 },
];

router.get('/', async (req, res) => {
  try {
    if (useStatic) return res.json({ success: true, data: staticProjects });
    const featured = req.query.featured === 'true';
    const q = featured ? 'SELECT * FROM projects WHERE is_featured=1 ORDER BY sort_order ASC LIMIT 6' : 'SELECT * FROM projects ORDER BY sort_order ASC, created_at DESC';
    const [rows] = await db.query(q);
    res.json({ success: true, data: rows });
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ER_NO_SUCH_TABLE') { useStatic = true; return res.json({ success: true, data: staticProjects }); }
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, location, capacity, type, description, image_url, savings, is_featured, sort_order } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title required' });
    const [r] = await db.query('INSERT INTO projects (title, location, capacity, type, description, image_url, savings, is_featured, sort_order) VALUES (?,?,?,?,?,?,?,?,?)',
      [title, location||'', capacity||'', type||'Residential', description||'', image_url||'', savings||'', is_featured?1:0, sort_order||0]);
    const [[p]] = await db.query('SELECT * FROM projects WHERE id=?', [r.insertId]);
    res.status(201).json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const fields = ['title','location','capacity','type','description','image_url','savings','is_featured','sort_order'];
    const updates = []; const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(f+'=?'); params.push(req.body[f]); }});
    if (!updates.length) return res.status(400).json({ success: false });
    params.push(req.params.id);
    await db.query('UPDATE projects SET '+updates.join(',')+' WHERE id=?', params);
    const [[p]] = await db.query('SELECT * FROM projects WHERE id=?', [req.params.id]);
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try { await db.query('DELETE FROM projects WHERE id=?', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

module.exports = router;
