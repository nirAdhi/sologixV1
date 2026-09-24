const { testConnection, syncLead } = require('../services/hubspot');
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { auth, requireSuperAdmin, requirePermission, JWT_SECRET } = require('../middleware/auth');
const { sendStatusUpdate, sendCustomEmail, sendBookingConfirmation } = require('../config/email');

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const [admins] = await db.query(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    );

    if (admins.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    const admin = admins[0];

    // SECURITY: deactivated admins must not be able to log in.
    if (!admin.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // `type: 'admin'` is what middleware/auth.js now requires; customer tokens
    // carry `type: 'customer'` and are rejected on admin routes.
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, type: 'admin' },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// List all sub-admins (staff)
router.get('/subadmins', auth, requireSuperAdmin, async (req, res) => {
  try {
    const [subadmins] = await db.query(
      'SELECT id, email, name, role, permissions, is_active, created_at FROM admins WHERE role != "super_admin" ORDER BY created_at DESC'
    );
    res.json({ success: true, data: subadmins });
  } catch (error) {
    console.error('Error fetching subadmins:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subadmins' });
  }
});

// Create sub-admin (staff)
router.post('/subadmins', auth, requireSuperAdmin, [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').isIn(['admin', 'staff']).withMessage('Role must be admin or staff')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, name, role, permissions } = req.body;

    const [existing] = await db.query('SELECT id FROM admins WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const permissionsJson = JSON.stringify(permissions || {
      manage_services: role === 'admin',
      manage_bookings: true,
      manage_subadmins: false,
      manage_customers: role === 'admin',
      view_reports: role === 'admin',
      manage_settings: false,
      manage_delivery: true
    });

    const [result] = await db.query(
      'INSERT INTO admins (email, password, name, role, permissions, is_active) VALUES (?, ?, ?, ?, ?, true)',
      [email, hashedPassword, name, role || 'staff', permissionsJson]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Staff created',
      data: { id: result.insertId, email, name, role: role || 'staff', permissions: JSON.parse(permissionsJson) }
    });
  } catch (error) {
    console.error('Error creating subadmin:', error);
    res.status(500).json({ success: false, message: 'Failed to create staff' });
  }
});

// Update sub-admin (staff)
router.put('/subadmins/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, is_active, role, permissions } = req.body;
    if (role !== undefined && !['admin', 'staff'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be admin or staff' });
    }
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    const [subadmin] = await db.query('SELECT id FROM admins WHERE id = ? AND role != "super_admin"', [req.params.id]);
    if (subadmin.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    const permissionsJson = permissions ? JSON.stringify(permissions) : null;

    await db.query(
      'UPDATE admins SET name = ?, email = ?, is_active = ?, role = ?, permissions = ? WHERE id = ?',
      [name, email, is_active, role || 'staff', permissionsJson, req.params.id]
    );

    res.json({ success: true, message: 'Staff updated' });
  } catch (error) {
    console.error('Error updating subadmin:', error);
    res.status(500).json({ success: false, message: 'Failed to update staff' });
  }
});

// Delete sub-admin
router.delete('/subadmins/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    const [subadmin] = await db.query('SELECT id FROM admins WHERE id = ? AND role != "super_admin"', [req.params.id]);
    if (subadmin.length === 0) {
      return res.status(404).json({ success: false, message: 'Staff not found' });
    }

    await db.query('DELETE FROM admins WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Sub-admin deleted' });
  } catch (error) {
    console.error('Error deleting subadmin:', error);
    res.status(500).json({ success: false, message: 'Failed to delete sub-admin' });
  }
});


router.get('/me', auth, async (req, res) => {
  try {
    const [admins] = await db.query(
      'SELECT id, email, name, role, created_at FROM admins WHERE id = ?',
      [req.admin.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({ success: true, data: admins[0] });
  } catch (error) {
    console.error('Error fetching admin:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin data' });
  }
});

router.get('/bookings', auth, async (req, res) => {
  try {
    const { status, date_from, date_to, search, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT b.*, s.name as service_name, s.description as service_description,
             c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             c.address as customer_address
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }
    
    if (date_from) {
      query += ' AND b.appointment_date >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND b.appointment_date <= ?';
      params.push(date_to);
    }
    
    if (search) {
      query += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR b.booking_id LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    query += ' ORDER BY b.created_at DESC';
    
    const parsedLimit = parseInt(limit) || 20;
    const parsedPage = parseInt(page) || 1;
    const offset = (parsedPage - 1) * parsedLimit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parsedLimit, offset);
    
    const [bookings] = await db.query(query, params);
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE 1=1
    `;
    const countParams = [];
    
    if (status) {
      countQuery += ' AND b.status = ?';
      countParams.push(status);
    }
    if (date_from) {
      countQuery += ' AND b.appointment_date >= ?';
      countParams.push(date_from);
    }
    if (date_to) {
      countQuery += ' AND b.appointment_date <= ?';
      countParams.push(date_to);
    }
    if (search) {
      countQuery += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR b.booking_id LIKE ?)';
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    
    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

router.put('/bookings/:id/status', auth, requirePermission('manage_bookings'), async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    await db.query(
      'UPDATE bookings SET status = ?, admin_notes = ? WHERE id = ? OR booking_id = ?',
      [status, admin_notes, req.params.id, req.params.id]
    );

    const [booking] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name, c.phone as customer_phone,
             s.name as service_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      WHERE b.id = ? OR b.booking_id = ?
    `, [req.params.id, req.params.id]);

    if (booking[0] && booking[0].customer_email) {
      await sendStatusUpdate(booking[0]);
    }

    res.json({ 
      success: true, 
      message: 'Booking status updated', 
      data: booking[0] 
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking' });
  }
});

router.put('/bookings/:id/confirm-payment', auth, requireSuperAdmin, async (req, res) => {
  try {
    const [booking] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name, c.phone as customer_phone,
             c.address as customer_address, s.name as service_name, s.description as service_description,
             s.duration_hours
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      WHERE b.id = ? OR b.booking_id = ?
    `, [req.params.id, req.params.id]);

    if (booking.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await db.query(`
      UPDATE bookings 
      SET payment_status = 'completed', status = 'confirmed', 
          payment_completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? OR booking_id = ?
    `, [req.params.id, req.params.id]);

    const [updatedBooking] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name, c.phone as customer_phone,
             c.address as customer_address, s.name as service_name, s.description as service_description,
             s.duration_hours
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      WHERE b.id = ? OR b.booking_id = ?
    `, [req.params.id, req.params.id]);

    // Log admin payment confirmation
    if (updatedBooking[0]) {
      try {
        await db.query(`
          INSERT INTO payment_transactions 
          (booking_id, transaction_type, payment_method, amount, status, gateway_response)
          VALUES (?, 'admin_confirm', ?, ?, 'captured', ?)
        `, [
          updatedBooking[0].booking_id,
          updatedBooking[0].payment_method || 'manual_upi',
          updatedBooking[0].total_amount,
          JSON.stringify({ confirmed_by: req.admin?.email, payment_id: updatedBooking[0].payment_id })
        ]);
      } catch (logErr) {
        console.warn('Failed to log admin confirmation:', logErr.message);
      }
    }

    if (updatedBooking[0] && updatedBooking[0].customer_email) {
      await sendBookingConfirmation(updatedBooking[0]);
    }

    res.json({ 
      success: true, 
      message: 'Payment confirmed and booking confirmed', 
      data: updatedBooking[0] 
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm payment' });
  }
});

router.put('/bookings/:id/reschedule', auth, requirePermission('manage_bookings'), [
  body('appointment_date').notEmpty().withMessage('Appointment date is required'),
  body('appointment_time').notEmpty().withMessage('Appointment time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { appointment_date, appointment_time } = req.body;

    await db.query(
      'UPDATE bookings SET appointment_date = ?, appointment_time = ?, status = ? WHERE id = ? OR booking_id = ?',
      [appointment_date, appointment_time, 'pending', req.params.id, req.params.id]
    );

    const [booking] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name, c.phone as customer_phone,
             s.name as service_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      WHERE b.id = ? OR b.booking_id = ?
    `, [req.params.id, req.params.id]);

    if (booking[0] && booking[0].customer_email) {
      await sendStatusUpdate({ ...booking[0], status: 'rescheduled' });
    }

    res.json({ 
      success: true, 
      message: 'Appointment rescheduled', 
      data: booking[0] 
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    res.status(500).json({ success: false, message: 'Failed to reschedule booking' });
  }
});

router.post('/bookings/:id/email', auth, requirePermission('manage_bookings'), async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (typeof subject !== 'string' || typeof message !== 'string' ||
        !subject.trim() || !message.trim() || subject.length > 200 || message.length > 5000) {
      return res.status(400).json({ success: false, message: 'Subject (<=200 chars) and message (<=5000 chars) are required' });
    }

    const [booking] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ? OR b.booking_id = ?
    `, [req.params.id, req.params.id]);

    if (!booking[0] || !booking[0].customer_email) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking or customer email not found' 
      });
    }

    await sendCustomEmail(booking[0].customer_email, subject, message, booking[0].customer_name);

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error.message);
    res.status(error.status === 400 ? 400 : 500).json({ success: false, message: error.status ? error.message : 'Failed to send email' });
  }
});

router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const [totalBookings] = await db.query(
      'SELECT COUNT(*) as count FROM bookings'
    );

    const [pendingBookings] = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE status = "pending"'
    );

    const [confirmedBookings] = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE status = "confirmed"'
    );

    const [completedBookings] = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE status = "completed"'
    );

    const [totalRevenue] = await db.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE payment_status = "completed"'
    );

    const [todayBookings] = await db.query(
      'SELECT COUNT(*) as count FROM bookings WHERE DATE(appointment_date) = DATE(CONVERT_TZ(NOW(), "+00:00", "+05:30"))'
    );

    const [upcomingBookings] = await db.query(`
      SELECT b.*, c.name as customer_name, c.phone as customer_phone, s.name as service_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      WHERE DATE(b.appointment_date) >= DATE(CONVERT_TZ(NOW(), "+00:00", "+05:30")) AND b.status IN ('pending', 'confirmed')
      ORDER BY b.appointment_date ASC, b.appointment_time ASC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        totalBookings: totalBookings[0].count,
        pendingBookings: pendingBookings[0].count,
        confirmedBookings: confirmedBookings[0].count,
        completedBookings: completedBookings[0].count,
        totalRevenue: totalRevenue[0].total,
        todayBookings: todayBookings[0].count,
        upcomingBookings
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

router.get('/services', auth, async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services ORDER BY created_at DESC');
    res.json({ success: true, data: services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
});

router.post('/services', auth, requirePermission('manage_services'), [
  body('name').notEmpty().withMessage('Service name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, description, price, duration_hours, features, image_url } = req.body;

    const [result] = await db.query(`
      INSERT INTO services (name, description, price, duration_hours, features, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, description, price, duration_hours || 4, JSON.stringify(features || []), image_url]);

    res.status(201).json({ 
      success: true, 
      message: 'Service created', 
      data: { id: result.insertId, ...req.body } 
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
});

router.put('/services/:id', auth, requirePermission('manage_services'), async (req, res) => {
  try {
    const { name, description, price, duration_hours, features, image_url, is_active } = req.body;
    if (!name || typeof name !== 'string' || name.length > 200) {
      return res.status(400).json({ success: false, message: 'Service name is required' });
    }
    if (price === undefined || Number.isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number' });
    }
    if (image_url && !/^(https:\/\/|data:image\/|\/uploads\/)/.test(String(image_url))) {
      return res.status(400).json({ success: false, message: 'image_url must be an https URL, data URI, or /uploads/ path' });
    }

    await db.query(`
      UPDATE services 
      SET name = ?, description = ?, price = ?, duration_hours = ?, features = ?, image_url = ?, is_active = ?
      WHERE id = ?
    `, [name, description, price, duration_hours, JSON.stringify(features || []), image_url, is_active, req.params.id]);

    res.json({ success: true, message: 'Service updated' });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
});

router.delete('/services/:id', auth, requireSuperAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM services WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
});

// Update booking delivery and installation status
router.put('/bookings/:id/progress', auth, requirePermission('manage_bookings'), async (req, res) => {
  try {
    const { 
      delivery_status, 
      delivery_date, 
      delivery_notes,
      installation_scheduled_date,
      installation_completed_date,
      installation_notes,
      work_progress 
    } = req.body;

    await db.query(`
      UPDATE bookings 
      SET delivery_status = COALESCE(?, delivery_status),
          delivery_date = COALESCE(?, delivery_date),
          delivery_notes = COALESCE(?, delivery_notes),
          installation_scheduled_date = COALESCE(?, installation_scheduled_date),
          installation_completed_date = COALESCE(?, installation_completed_date),
          installation_notes = COALESCE(?, installation_notes),
          work_progress = COALESCE(?, work_progress),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? OR booking_id = ?
    `, [
      delivery_status, 
      delivery_date, 
      delivery_notes,
      installation_scheduled_date,
      installation_completed_date,
      installation_notes,
      work_progress,
      req.params.id, 
      req.params.id
    ]);

    const [booking] = await db.query(`
      SELECT b.*, s.name as service_name, c.name as customer_name, c.email as customer_email
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ? OR b.booking_id = ?
    `, [req.params.id, req.params.id]);

    res.json({ 
      success: true, 
      message: 'Booking progress updated',
      data: booking[0]
    });
  } catch (error) {
    console.error('Error updating booking progress:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking progress' });
  }
});

// Get all customers
router.get('/customers', auth, requirePermission('manage_customers'), async (req, res) => {
  try {
    const [customers] = await db.query(`
      SELECT c.id, c.name, c.email, c.phone, c.alternate_phone, c.address, c.city, c.state, c.pincode,
             c.service_interest, c.how_heard, c.created_at,
             (c.password IS NOT NULL) as has_account,
             COUNT(b.id) as booking_count,
             MAX(b.created_at) as last_booking_date
      FROM customers c
      LEFT JOIN bookings b ON c.id = b.customer_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
});

// ===== TRANSACTIONS ENDPOINTS =====

// Get transaction summary (aggregated stats)
router.get('/transactions/summary', auth, async (req, res) => {
  try {
    const [totalCollected] = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE payment_status = 'completed'"
    );
    const [pendingVerification] = await db.query(
      "SELECT COUNT(*) as count FROM bookings WHERE payment_status = 'pending_verification'"
    );
    const [failedCount] = await db.query(
      "SELECT COUNT(*) as count FROM bookings WHERE payment_status = 'failed'"
    );
    const [refundedCount] = await db.query(
      "SELECT COUNT(*) as count FROM bookings WHERE payment_status = 'refunded'"
    );
    const [totalTransactions] = await db.query(
      "SELECT COUNT(*) as count FROM bookings WHERE payment_status != 'pending'"
    );
    const [razorpayCount] = await db.query(
      "SELECT COUNT(*) as count FROM bookings WHERE payment_gateway = 'razorpay' AND payment_status = 'completed'"
    );
    const [upiCount] = await db.query(
      "SELECT COUNT(*) as count FROM bookings WHERE payment_gateway = 'manual_upi' AND payment_status = 'completed'"
    );
    const [methodBreakdown] = await db.query(
      "SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM bookings WHERE payment_status = 'completed' AND payment_method IS NOT NULL GROUP BY payment_method"
    );

    res.json({
      success: true,
      data: {
        totalCollected: totalCollected[0].total,
        pendingVerification: pendingVerification[0].count,
        failedCount: failedCount[0].count,
        refundedCount: refundedCount[0].count,
        totalTransactions: totalTransactions[0].count,
        razorpayCount: razorpayCount[0].count,
        upiCount: upiCount[0].count,
        methodBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching transaction summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transaction summary' });
  }
});

// Get all transactions (paginated, filterable)
router.get('/transactions', auth, async (req, res) => {
  try {
    const { payment_status, payment_method, payment_gateway, date_from, date_to, search, page = 1, limit = 25 } = req.query;

    let query = `
      SELECT b.booking_id, b.total_amount, b.payment_status, b.payment_method, b.payment_gateway,
             b.payment_id, b.razorpay_order_id, b.razorpay_payment_id, b.payment_failure_reason,
             b.payment_completed_at, b.created_at, b.updated_at,
             c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             s.name as service_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (payment_status) {
      query += ' AND b.payment_status = ?';
      params.push(payment_status);
    }
    if (payment_method) {
      query += ' AND b.payment_method = ?';
      params.push(payment_method);
    }
    if (payment_gateway) {
      query += ' AND b.payment_gateway = ?';
      params.push(payment_gateway);
    }
    if (date_from) {
      query += ' AND b.created_at >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND b.created_at <= ?';
      params.push(date_to + ' 23:59:59');
    }
    if (search) {
      query += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR b.booking_id LIKE ? OR b.payment_id LIKE ?)';
      const sp = `%${search}%`;
      params.push(sp, sp, sp, sp, sp);
    }

    // Count query
    let countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await db.query(countQuery, params);

    query += ' ORDER BY b.updated_at DESC';
    const parsedLimit = parseInt(limit) || 25;
    const parsedPage = parseInt(page) || 1;
    const offset = (parsedPage - 1) * parsedLimit;
    query += ' LIMIT ? OFFSET ?';
    params.push(parsedLimit, offset);

    const [transactions] = await db.query(query, params);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

// Get transaction audit log for a specific booking
router.get('/transactions/:bookingId/log', auth, async (req, res) => {
  try {
    const [logs] = await db.query(`
      SELECT * FROM payment_transactions 
      WHERE booking_id = ? 
      ORDER BY created_at DESC
    `, [req.params.bookingId]);

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching transaction log:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transaction log' });
  }
});

// Get customer bookings (admin)
router.get('/customers/:id/bookings', auth, requirePermission('manage_customers'), async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT b.*, s.name as service_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
    `, [req.params.id]);

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Error fetching customer bookings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});


// ── HubSpot Integration Endpoints ──
// SECURITY: HubSpot integration is super-admin only. The private-app token is a
// secret and must NOT be stored in site_settings (that table is served publicly
// by GET /api/site-settings). Set HUBSPOT_TOKEN / HUBSPOT_PORTAL_ID in
// .env.docker so it survives restarts; /hubspot/save only applies it to the
// running process until the next restart.
router.get('/hubspot/test', auth, requireSuperAdmin, async (req, res) => {
  try {
    const result = await testConnection();
    res.json({ success: true, data: result });
  } catch(e) {
    res.status(400).json({ success: false, message: 'HubSpot connection failed' });
  }
});

router.post('/hubspot/save', auth, requireSuperAdmin, async (req, res) => {
  const { token, portal_id } = req.body;
  if (typeof token !== 'string' || !/^[A-Za-z0-9-]{20,200}$/.test(token)) {
    return res.status(400).json({ success: false, message: 'A valid HubSpot private app token is required' });
  }
  process.env.HUBSPOT_TOKEN = token;
  process.env.HUBSPOT_PORTAL_ID = String(portal_id || '').replace(/[^0-9]/g, '');
  res.json({
    success: true,
    message: 'HubSpot connected for this session. To keep it after a restart, add HUBSPOT_TOKEN (and HUBSPOT_PORTAL_ID) to .env.docker on the server.'
  });
});

router.post('/hubspot/sync-test', auth, requireSuperAdmin, async (req, res) => {
  try {
    const result = await syncLead({
      name: 'Test Lead', phone: '9000000000', email: 'test@sologixenergy.in',
      service_interest: 'Test Sync', source: 'manual', message: 'HubSpot sync test from admin panel'
    });
    res.json({ success: true, data: result });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
