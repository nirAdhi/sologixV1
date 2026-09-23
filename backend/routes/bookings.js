const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Public booking endpoints are abuse targets (slot exhaustion, data lookup).
// Tighter than the global 200/15min limiter.
const publicBookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true, legacyHeaders: false
});
const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, message: 'Too many lookups, please try again later.' },
  standardHeaders: true, legacyHeaders: false
});

const ALLOWED_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
const BOOKING_ID_RE = /^SOL[A-Z0-9]{8,32}$/;

// Fields safe to show to an unauthenticated caller who knows a booking_id.
// Deliberately excludes address, admin_notes, internal ids and gateway order ids.
const PUBLIC_BOOKING_COLUMNS = `
  b.booking_id, b.appointment_date, b.appointment_time, b.status, b.payment_status,
  b.payment_id, b.razorpay_payment_id, b.total_amount, b.created_at,
  s.name as service_name, c.name as customer_name, c.email as customer_email, c.phone as customer_phone`;
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { sendBookingConfirmation, sendStatusUpdate } = require('../config/email');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/auth');
const canManage = requirePermission('manage_bookings');

// SECURITY: booking_id acts as a bearer credential for the confirmation page
// and payment endpoints, so it must be unguessable. Math.random() (4 chars) was not.
const generateBookingId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(6).toString('hex').toUpperCase(); // 48 bits
  return `SOL${timestamp}${random}`;
};

// Public "track my booking" lookup.
// SECURITY (was Critical): previously returned EVERY booking with full customer
// PII to anyone, and with no filter at all. Now: a filter is mandatory, only
// non-personal booking fields are returned, and it is rate limited.
// NOTE: knowing someone's email/phone still reveals their booking *status*.
// The proper long-term fix is to require customer login (see /api/customer/bookings).
router.get('/', lookupLimiter, async (req, res) => {
  try {
    const { email, phone } = req.query;
    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'email or phone query parameter is required' });
    }

    let where, param;
    if (email) {
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email' });
      }
      where = 'c.email = ?'; param = email.trim().toLowerCase();
    } else {
      const digits = String(phone).replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) {
        return res.status(400).json({ success: false, message: 'Invalid phone' });
      }
      where = "REPLACE(REPLACE(REPLACE(c.phone,' ',''),'-',''),'+','') LIKE ?"; param = '%' + digits.slice(-10);
    }

    const [bookings] = await db.query(`
      SELECT b.id, b.booking_id, b.appointment_date, b.appointment_time, b.status, b.payment_status,
             b.total_amount, b.created_at, s.name as service_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN customers c ON b.customer_id = c.id
      WHERE ${where}
      ORDER BY b.created_at DESC
      LIMIT 50
    `, [param]);
    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

router.get('/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

    const [bookedSlots] = await db.query(
      `SELECT appointment_time FROM bookings 
       WHERE appointment_date = ? 
       AND status IN ('pending', 'confirmed')`,
      [date]
    );

    const bookedTimes = bookedSlots.map(b => b.appointment_time.substring(0, 5));
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({ 
      success: true, 
      data: availableSlots,
      booked: bookedTimes
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available slots' });
  }
});

// SECURITY (was High): accepted the numeric primary key, so /api/bookings/1,2,3...
// enumerated every booking with full PII. Now only the random booking_id works,
// and internal/sensitive columns are not returned.
router.get('/:id', lookupLimiter, async (req, res) => {
  try {
    if (!BOOKING_ID_RE.test(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const [bookings] = await db.query(`
      SELECT ${PUBLIC_BOOKING_COLUMNS}
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.booking_id = ?
    `, [req.params.id]);
    
    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    res.json({ success: true, data: bookings[0] });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
});

router.post('/', publicBookingLimiter, [
  body('customer_name').notEmpty().withMessage('Customer name is required'),
  body('customer_email').isEmail().withMessage('Valid email is required'),
  body('customer_phone').notEmpty().withMessage('Phone number is required'),
  body('service_id').isInt().withMessage('Service ID is required'),
  body('appointment_date').isDate().withMessage('Valid date is required'),
  body('appointment_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      service_id,
      appointment_date,
      appointment_time,
      notes,
      create_account,
      password
    } = req.body;

    const [existingCustomer] = await db.query(
      'SELECT id, password FROM customers WHERE email = ?',
      [customer_email]
    );

    let customerId;
    let createdAccount = false;

    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
      // SECURITY (was High): this used to overwrite the existing customer's
      // name/phone/address and could SET A PASSWORD on their account, all from an
      // unauthenticated request that merely knew their email (account takeover).
      // Existing customers are now left untouched; they can update details after
      // logging in. Account creation for an existing email must go through
      // /api/customer/register (which verifies the email is not yet claimed).
      if (create_account && password) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please log in to book, or book as a guest without creating an account.'
        });
      }
    } else {
      // Create new customer
      if (create_account && password) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
          'INSERT INTO customers (name, email, phone, password, address) VALUES (?, ?, ?, ?, ?)',
          [customer_name, customer_email, customer_phone, hashedPassword, customer_address || null]
        );
        customerId = result.insertId;
        createdAccount = true;
      } else {
        const [result] = await db.query(
          'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
          [customer_name, customer_email, customer_phone, customer_address || null]
        );
        customerId = result.insertId;
      }
    }

    const bookingId = generateBookingId();

    const [result] = await db.query(`
      INSERT INTO bookings 
      (booking_id, customer_id, service_id, appointment_date, appointment_time, notes, total_amount, payment_status, status)
      VALUES (?, ?, ?, ?, ?, ?, 0, 'completed', 'confirmed')
    `, [bookingId, customerId, service_id, appointment_date, appointment_time, notes || null]);

    const [newBooking] = await db.query(`
      SELECT b.*, s.name as service_name, 
             c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        ...newBooking[0],
        account_created: createdAccount,
        razorpay_order_id: null
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

// Quick booking for mobile popup
router.post('/quick', publicBookingLimiter, [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').isMobilePhone('en-IN').withMessage('Phone is required'),
  body('service_id').optional().isInt().withMessage('Service ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone, service_id } = req.body;

    // Get default service (first active service) if not provided
    let serviceId = service_id;
    if (!serviceId) {
      const [services] = await db.query(
        'SELECT id FROM services WHERE is_active = true ORDER BY id LIMIT 1'
      );
      if (services.length === 0) {
        return res.status(400).json({ success: false, message: 'No active services available' });
      }
      serviceId = services[0].id;
    }

    // Check if customer exists by phone
    const [existingCustomer] = await db.query(
      'SELECT id FROM customers WHERE phone = ?',
      [phone]
    );

    let customerId;
    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
      // SECURITY: do not let an unauthenticated request rename an existing
      // customer just because it supplied their phone number.
    } else {
      // Create a temporary email using phone
      const tempEmail = `temp_${phone}@sologixenergy.in`;
      const [result] = await db.query(
        'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
        [name, tempEmail, phone]
      );
      customerId = result.insertId;
    }

    // Determine tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let appointmentDate = tomorrow.toISOString().split('T')[0];
    let appointmentTime;

    // Get first available slot for tomorrow
    const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
    const [bookedSlots] = await db.query(
      `SELECT appointment_time FROM bookings 
       WHERE appointment_date = ? 
       AND status IN ('pending', 'confirmed')`,
      [appointmentDate]
    );
    const bookedTimes = bookedSlots.map(b => b.appointment_time.substring(0, 5));
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    
    if (availableSlots.length === 0) {
      // If no slots tomorrow, try day after tomorrow
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);
      const appointmentDate2 = dayAfter.toISOString().split('T')[0];
      const [bookedSlots2] = await db.query(
        `SELECT appointment_time FROM bookings 
         WHERE appointment_date = ? 
         AND status IN ('pending', 'confirmed')`,
        [appointmentDate2]
      );
      const bookedTimes2 = bookedSlots2.map(b => b.appointment_time.substring(0, 5));
      const availableSlots2 = allSlots.filter(slot => !bookedTimes2.includes(slot));
      if (availableSlots2.length === 0) {
        return res.status(400).json({ success: false, message: 'No available slots in next two days. Please book through regular booking.' });
      }
      appointmentDate = appointmentDate2;
      appointmentTime = availableSlots2[0];
    } else {
      appointmentTime = availableSlots[0];
    }

    const bookingId = generateBookingId();

    const [result] = await db.query(`
      INSERT INTO bookings 
      (booking_id, customer_id, service_id, appointment_date, appointment_time, notes, total_amount, payment_status, status)
      VALUES (?, ?, ?, ?, ?, ?, 0, 'completed', 'confirmed')
    `, [bookingId, customerId, serviceId, appointmentDate, appointmentTime, 'Quick booking from mobile popup']);

    const [newBooking] = await db.query(`
      SELECT b.*, s.name as service_name, 
             c.name as customer_name, c.email as customer_email, c.phone as customer_phone
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. We will contact you shortly.',
      data: newBooking[0]
    });
  } catch (error) {
    console.error('Error creating quick booking:', error);
    res.status(500).json({ success: false, message: 'Failed to create booking' });
  }
});

// Update booking (admin only)
router.put('/:id', auth, canManage, async (req, res) => {
  try {
    const { appointment_date, appointment_time, notes } = req.body;
    
    await db.query(
      'UPDATE bookings SET appointment_date = ?, appointment_time = ?, notes = ? WHERE id = ? OR booking_id = ?',
      [appointment_date, appointment_time, notes, req.params.id, req.params.id]
    );
    
    const [booking] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name, c.phone as customer_phone
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ? OR b.booking_id = ?
    `, [req.params.id, req.params.id]);
    
    res.json({ success: true, message: 'Booking updated successfully', data: booking[0] });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

module.exports = router;
