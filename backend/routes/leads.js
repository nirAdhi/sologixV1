const { syncLead } = require('../services/hubspot');
const express = require('express');
const { leadValidators, formLimiter } = require('../middleware/security');
const router = express.Router();
const { notifyAdminNewLead, later } = require('../config/email');
const db = require('../config/database');
const { auth, requirePermission, requireSuperAdmin } = require('../middleware/auth');

const STAGES = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
const PRIORITIES = ['low', 'medium', 'high'];
// Sources a visitor can legitimately submit from the public site. Internal
// values such as 'manual' or 'referral' are for staff-created leads only.
const PUBLIC_SOURCES = ['website', 'contact_us', 'partner', 'booking_request', 'consultation', 'calculator', 'product_quote', 'whatsapp'];
const clip = (v, n) => (v === undefined || v === null || v === '') ? null : String(v).trim().slice(0, n);
const canManage = [auth, requirePermission('manage_leads')];

// POST public lead (no auth required - for partner forms, contact forms, etc.)
// Changes: no in-memory "static" mode (a single DB error used to switch every
// later submission into a RAM array that was lost on restart, while telling the
// visitor "Received!"); DB errors now return 503 so the page can ask them to call.
// Priority is not client-controlled on the public form.
router.post('/public', formLimiter, ...leadValidators, async (req, res) => {
  try {
    const { name, email, phone, address, service_interest, message, source } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
    const src = PUBLIC_SOURCES.includes(source) ? source : 'website';
    const lead = {
      name: clip(name, 255), email: clip(email, 255), phone: clip(phone, 20), address: clip(address, 500),
      service_interest: clip(service_interest, 100), message: clip(message, 2000), source: src
    };
    const [result] = await db.query(
      'INSERT INTO leads (name, email, phone, address, service_interest, message, source, priority, stage) VALUES (?,?,?,?,?,?,?,?,?)',
      [lead.name, lead.email, lead.phone, lead.address, lead.service_interest, lead.message, lead.source, 'medium', 'new']
    );
    res.status(201).json({ success: true, message: 'Received!' });
    // Booking requests already trigger a 'new booking' email, so skip those here.
    if (lead.source !== 'booking_request') later(notifyAdminNewLead, lead);
    // Async HubSpot sync — fire and forget, never blocks the response
    syncLead(lead).catch(() => {});
  } catch (e) {
    console.error('Public lead save failed:', e.code || e.message);
    res.status(503).json({ success: false, message: 'We could not save your request right now. Please call or WhatsApp us.' });
  }
});

// GET all leads
router.get('/', ...canManage, async (req, res) => {
  try {
    const stage = typeof req.query.stage === 'string' ? req.query.stage : '';
    const search = typeof req.query.search === 'string' ? req.query.search.slice(0, 100) : '';
    let q = 'SELECT * FROM leads WHERE 1=1';
    const params = [];
    if (stage && STAGES.includes(stage)) { q += ' AND stage = ?'; params.push(stage); }
    if (search) { q += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    q += ' ORDER BY created_at DESC LIMIT 2000';
    const [rows] = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('Load leads failed:', e.message);
    res.status(500).json({ success: false, message: 'Failed to fetch leads' });
  }
});

// GET pipeline summary (count by stage)
router.get('/pipeline', ...canManage, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT stage, COUNT(*) as count FROM leads GROUP BY stage');
    res.json({ success: true, data: rows });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// GET single lead with notes
router.get('/:id', ...canManage, async (req, res) => {
  try {
    const [[lead]] = await db.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!lead) return res.status(404).json({ success: false, message: 'Not found' });
    const [notes] = await db.query('SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json({ success: true, data: { ...lead, notes } });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// POST create lead (staff)
router.post('/', ...canManage, async (req, res) => {
  try {
    const { name, email, phone, address, service_interest, message, source, priority, assigned_to, follow_up_date } = req.body;
    if (!name || !phone) return res.status(400).json({ success: false, message: 'Name and phone required' });
    if (priority !== undefined && !PRIORITIES.includes(priority)) return res.status(400).json({ success: false, message: 'Invalid priority' });
    const [result] = await db.query(
      'INSERT INTO leads (name, email, phone, address, service_interest, message, source, priority, assigned_to, follow_up_date) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [clip(name, 255), clip(email, 255), clip(phone, 20), clip(address, 500), clip(service_interest, 100), clip(message, 5000),
       clip(source, 50) || 'manual', priority || 'medium', clip(assigned_to, 255), follow_up_date || null]
    );
    const [[lead]] = await db.query('SELECT * FROM leads WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: lead });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to create lead' }); }
});

// PUT update lead
router.put('/:id', ...canManage, async (req, res) => {
  try {
    if (req.body.stage !== undefined && !STAGES.includes(req.body.stage)) return res.status(400).json({ success: false, message: 'Invalid stage' });
    if (req.body.priority !== undefined && !PRIORITIES.includes(req.body.priority)) return res.status(400).json({ success: false, message: 'Invalid priority' });
    const fields = ['name', 'email', 'phone', 'address', 'service_interest', 'message', 'stage', 'priority', 'assigned_to', 'notes', 'follow_up_date'];
    const updates = [];
    const params = [];
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); } });
    if (!updates.length) return res.status(400).json({ success: false, message: 'Nothing to update' });
    params.push(req.params.id);
    const [r] = await db.query(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, params);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Not found' });
    const [[lead]] = await db.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: lead });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed to update lead' }); }
});

// PUT update stage only (quick kanban move)
router.put('/:id/stage', ...canManage, async (req, res) => {
  try {
    if (!STAGES.includes(req.body.stage)) return res.status(400).json({ success: false, message: 'Invalid stage' });
    const [r] = await db.query('UPDATE leads SET stage = ? WHERE id = ?', [req.body.stage, req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// POST add note to lead
router.post('/:id/notes', ...canManage, async (req, res) => {
  try {
    const note = clip(req.body.note, 5000);
    if (!note) return res.status(400).json({ success: false, message: 'Note required' });
    await db.query('INSERT INTO lead_notes (lead_id, note, created_by) VALUES (?,?,?)', [req.params.id, note, req.admin?.email || 'Admin']);
    const [notes] = await db.query('SELECT * FROM lead_notes WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);
    res.json({ success: true, data: notes });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

// DELETE lead — super admin only (irreversible; notes cascade)
router.delete('/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const [r] = await db.query('DELETE FROM leads WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (e) { res.status(500).json({ success: false, message: 'Failed' }); }
});

module.exports = router;
