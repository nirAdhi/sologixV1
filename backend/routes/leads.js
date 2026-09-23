const { syncLead } = require('../services/hubspot');
const express = require('express');
const { leadValidators, formLimiter, sanitizeStr, validateId } = require('../middleware/security');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

let useStatic = false;
const staticLeads = [];

// POST public lead (no auth required - for partner forms, contact forms, etc.)
router.post('/public', formLimiter, ...leadValidators, async (req, res) => {
  try {
    const { name, email, phone, address, service_interest, message, source, priority } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
    
    if (useStatic) {
      staticLeads.unshift({ id: Date.now(), name, email, phone, address, service_interest, message, source: source||'website', priority: priority||'medium', stage: 'new', created_at: new Date().toISOString() });
      return res.status(201).json({ success: true, message: 'Received!' });
    }
    
    const [result] = await db.query(
      'INSERT INTO leads (name, email, phone, address, service_interest, message, source, priority, stage) VALUES (?,?,?,?,?,?,?,?,?)',
      [sanitizeStr(name,100), email||null, phone, sanitizeStr(address,500)||null, sanitizeStr(service_interest,200)||null, sanitizeStr(message,2000)||null, source||'website', priority||'medium', 'new']
    );
    res.status(201).json({ success: true, message: 'Received!', data: { id: result.insertId } });
    // Async HubSpot sync — fire and forget, never blocks the response
    syncLead({ name, email, phone, address, service_interest, message, source }).catch(() => {});
  } catch (e) {
    if (e.code === 'ECONNREFUSED' || e.code === 'ER_NO_SUCH_TABLE') {
      useStatic = true;
      return res.status(201).json({ success: true, message: 'Received!' });
    }
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// GET all leads
router.get('/', auth, async (req, res) => {
  try {
    if (useStatic) return res.json({ success: true, data: staticLeads });
    const { stage, search } = req.query;
    let q = 'SELECT * FROM leads WHERE 1=1';
    const params = [];
    if (stage) { q += ' AND stage = ?'; params.push(stage); }
    if (search) { q += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)'; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
    q += ' ORDER BY created_at DESC';
    const [rows] = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (e) {
    if (e.code === 'ECONNREFUSED') { useStatic = true; return res.json({ success: true, data: staticLeads }); }
    res.status(500).json({ success: false, message: 'Failed to fetch leads' });
  }
});

// GET pipeline summary (count by stage)
router.get('/pipeline', auth, async (req, res) => {
  try {
    if (useStatic) return res.json({ success: true, data: [] });
    const [rows] = await db.query('SELECT stage, COUNT(*) as count FROM leads GROUP BY stage');
    res.json({ success: true, data: rows });
  } catch (e) {
    if (e.code === 'ECONNREFUSED') { useStatic = true; return res.json({ success: true, data: [] }); }
    res.status(500).json({ success: false, message: 'Failed' });
  }
});

// GET single lead with notes
router.get('/:id', auth, async (req, res) => {
  try {
    const [[lead]] = await db.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!lead) return res.status(404).json({ success: false, message: 'Not found' });
    const [notes] = await db.query('SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json({ success: true, data: { ...lead, notes } });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// POST create lead
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone, address, service_interest, message, source, priority, assigned_to, follow_up_date } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
    const [result] = await db.query(
      'INSERT INTO leads (name, email, phone, address, service_interest, message, source, priority, assigned_to, follow_up_date) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [name, email||null, phone, address||null, service_interest||null, message||null, source||'manual', priority||'medium', assigned_to||null, follow_up_date||null]
    );
    const [[lead]] = await db.query('SELECT * FROM leads WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: lead });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to create lead' }); }
});

// PUT update lead
router.put('/:id', auth, async (req, res) => {
  try {
    const fields = ['name','email','phone','address','service_interest','message','stage','priority','assigned_to','notes','follow_up_date'];
    const updates = [];
    const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }});
    if (!updates.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
    params.push(req.params.id);
    await db.query(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, params);
    const [[lead]] = await db.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: lead });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to update lead' }); }
});

// PUT update stage only (quick kanban move)
router.put('/:id/stage', auth, async (req, res) => {
  try {
    await db.query('UPDATE leads SET stage = ? WHERE id = ?', [req.body.stage, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// POST add note to lead
router.post('/:id/notes', auth, async (req, res) => {
  try {
    const { note } = req.body;
    if (!note) return res.status(400).json({ success: false, message: 'Note required' });
    await db.query('INSERT INTO lead_notes (lead_id, note, created_by) VALUES (?,?,?)', [req.params.id, note, req.admin?.email || 'Admin']);
    const [notes] = await db.query('SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json({ success: true, data: notes });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// DELETE lead
router.delete('/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM leads WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Lead deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

module.exports = router;
