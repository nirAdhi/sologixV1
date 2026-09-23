const { formLimiter, sanitizeStr } = require('../middleware/security');
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/auth');
const canManage = requirePermission('manage_customers');

// Submit callback request
router.post('/', formLimiter, [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('phone').isMobilePhone(['en-IN', 'any']).withMessage('Valid phone number is required'),
  body('message').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone, message } = req.body;

    const [result] = await db.query(
      'INSERT INTO callback_requests (name, phone, message) VALUES (?, ?, ?)',
      [name, phone, message || null]
    );

    res.json({
      success: true,
      message: 'Callback request submitted successfully. We will call you back soon!',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error submitting callback request:', error);
    res.status(500).json({ success: false, message: 'Failed to submit callback request' });
  }
});

// Get all callback requests (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const [requests] = await db.query(
      'SELECT * FROM callback_requests ORDER BY created_at DESC'
    );
    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error fetching callback requests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch callback requests' });
  }
});

// Update callback request status (admin only)
router.put('/:id/status', auth, canManage, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'contacted', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await db.query(
      'UPDATE callback_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating callback status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

module.exports = router;