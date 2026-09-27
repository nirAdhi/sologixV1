// One login for everyone: POST /api/auth/login checks the admins table first,
// then customers, and answers with which portal the person belongs to. The
// frontend login page uses this so visitors never have to pick Customer/Admin.
// Rate limited in server.js with the same limiter as the old login routes.
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { logEvent } = require('./track');

const FAIL = { success: false, message: 'Invalid email or password' }; // one message — no account enumeration

// Compared against on every miss so unknown emails cost the same ~bcrypt time
// as known ones (no timing-based account enumeration).
const DUMMY_HASH = bcrypt.hashSync('sologix-timing-equalizer', 10);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    const email = String(req.body.email).trim();
    const password = String(req.body.password);

    // 1. Admin? Any admin-table hit terminates here — a deactivated admin's
    // email must never fall through and log in as a customer.
    const [admins] = await db.query('SELECT * FROM admins WHERE email = ? LIMIT 1', [email]);
    if (admins.length) {
      const admin = admins[0];
      if (admin.is_active && await bcrypt.compare(password, admin.password)) {
        const token = jwt.sign(
          { id: admin.id, email: admin.email, role: admin.role, type: 'admin' },
          JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE || '1h' }
        );
        logEvent('admin_login');
        return res.json({
          success: true,
          data: { type: 'admin', token, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } },
        });
      }
      if (!admin.is_active) await bcrypt.compare(password, DUMMY_HASH); // keep timing uniform
      return res.status(401).json(FAIL); // don't fall through: an admin email is never a customer login
    }

    // 2. Customer?
    const [customers] = await db.query('SELECT * FROM customers WHERE email = ? LIMIT 1', [email]);
    const customer = customers[0];
    // Guest customers (created by a booking) have no password until they register.
    if (customer && customer.password) {
      if (await bcrypt.compare(password, customer.password)) {
        const token = jwt.sign(
          { id: customer.id, email: customer.email, type: 'customer' },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        logEvent('customer_login');
        return res.json({
          success: true,
          data: {
            type: 'customer', token,
            customer: { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone },
          },
        });
      }
      return res.status(401).json(FAIL);
    }

    await bcrypt.compare(password, DUMMY_HASH); // unknown email / guest: same cost as a real check
    return res.status(401).json(FAIL);
  } catch (e) {
    console.error('Unified login failed:', e.code || e.message);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

module.exports = router;
