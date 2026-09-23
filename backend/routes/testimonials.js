const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

let useStatic = false;

const staticTestimonials = [
  { id:1, name:'Subhash Jha', role:'Head - Administration', company:'Ranchi Gymkhana Club', location:'Ranchi, Jharkhand', review:'Overall experience was pleasing. The company and team were customer focused throughout the installation process. I recommend this company for solar installation.', capacity:'40 kW', savings:'Rs 3,36,000/yr', rating:5, photo_url:'', is_active:1 },
  { id:2, name:'Arun K. Singh', role:'IAS - DC - Jharkhand Govt.', company:'', location:'Ranchi, Jharkhand', review:'Team Sologix have done a brilliant job. My solar system is generating perfectly. I would recommend Sologix Energy for solar installation.', capacity:'3 kW', savings:'Rs 25,200/yr', rating:5, photo_url:'', is_active:1 },
  { id:3, name:'S. Chandrashekar', role:'Chairman', company:'D.B.M.S English School', location:'Jamshedpur, Jharkhand', review:'Technically best solar team in Jharkhand. Very professional, courteous, and respectful. I recommend Sologix Energy for rooftop solar installation.', capacity:'100 kW', savings:'Rs 8,40,000/yr', rating:5, photo_url:'', is_active:1 },
];

// GET all active testimonials (public)
router.get('/', async (req, res) => {
  try {
    if (useStatic) return res.json({ success: true, data: staticTestimonials });
    const adminMode = req.query.all === 'true';
    const q = adminMode ? 'SELECT * FROM testimonials ORDER BY sort_order ASC, created_at DESC' : 'SELECT * FROM testimonials WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC';
    const [rows] = await db.query(q);
    res.json({ success: true, data: rows });
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ER_NO_SUCH_TABLE') { useStatic = true; return res.json({ success: true, data: staticTestimonials }); }
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// POST create (admin)
router.post('/', auth, async (req, res) => {
  try {
    const { name, role, company, location, review, capacity, savings, rating, photo_url, is_active, sort_order } = req.body;
    if (!name || !review) return res.status(400).json({ success: false, message: 'Name and review required' });
    const [result] = await db.query(
      'INSERT INTO testimonials (name, role, company, location, review, capacity, savings, rating, photo_url, is_active, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [name, role||'', company||'', location||'', review, capacity||'', savings||'', rating||5, photo_url||'', is_active!==false?1:0, sort_order||0]
    );
    const [[t]] = await db.query('SELECT * FROM testimonials WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: t });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to create' }); }
});

// PUT update (admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const fields = ['name','role','company','location','review','capacity','savings','rating','photo_url','is_active','sort_order'];
    const updates = []; const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(f + ' = ?'); params.push(req.body[f]); }});
    if (!updates.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
    params.push(req.params.id);
    await db.query('UPDATE testimonials SET ' + updates.join(', ') + ' WHERE id = ?', params);
    const [[t]] = await db.query('SELECT * FROM testimonials WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: t });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to update' }); }
});

// DELETE (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

module.exports = router;
