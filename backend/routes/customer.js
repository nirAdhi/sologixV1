const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_do_not_use_in_production';
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: Using fallback JWT_SECRET. Set JWT_SECRET in production!');
}

// Customer registration
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { 
      name, 
      email, 
      phone, 
      password, 
      address,
      alternate_phone,
      city,
      state,
      pincode,
      service_interest,
      how_heard
    } = req.body;

    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM customers WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Build full address
    const fullAddress = address || '';
    const fullAddressWithCity = city || state || pincode 
      ? `${fullAddress}${fullAddress ? ', ' : ''}${city || ''}${city && state ? ', ' : ''}${state || ''}${pincode ? ' - ' + pincode : ''}`
      : fullAddress;

    // Create customer
    const [result] = await db.query(
      `INSERT INTO customers (name, email, phone, password, address, alternate_phone, city, state, pincode, service_interest, how_heard) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, hashedPassword, fullAddressWithCity, alternate_phone || null, city || null, state || null, pincode || null, service_interest || null, how_heard || null]
    );

    // Generate token
    const token = jwt.sign(
      { id: result.insertId, email, type: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        customer: {
          id: result.insertId,
          name,
          email,
          phone
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Customer login
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

    // Find customer
    const [customers] = await db.query('SELECT * FROM customers WHERE email = ?', [email]);
    if (customers.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const customer = customers[0];

    // If customer doesn't have a password, they must register first
    if (!customer.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'No account found. Please register first or book a service to create an account.' 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: customer.id, email: customer.email, type: 'customer' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

// Get customer profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'customer') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const [customers] = await db.query(
      'SELECT id, name, email, phone, address, created_at FROM customers WHERE id = ?',
      [decoded.id]
    );

    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({ success: true, data: customers[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

// Get customer bookings with progress
router.get('/bookings', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'customer') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const [bookings] = await db.query(`
      SELECT 
        b.*,
        s.name as service_name,
        s.description as service_description,
        s.duration_hours as service_duration
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
    `, [decoded.id]);

    res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// Get single booking details with progress
router.get('/bookings/:bookingId', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'customer') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const [bookings] = await db.query(`
      SELECT 
        b.*,
        s.name as service_name,
        s.description as service_description,
        s.duration_hours as service_duration,
        s.features as service_features
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.booking_id = ? AND b.customer_id = ?
    `, [req.params.bookingId, decoded.id]);

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: bookings[0] });
  } catch (error) {
    console.error('Booking detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking details' });
  }
});

// Update customer profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'customer') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const { name, phone, address } = req.body;

    await db.query(
      'UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name, phone, address, decoded.id]
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'customer') {
      return res.status(401).json({ success: false, message: 'Invalid token type' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const [customers] = await db.query('SELECT * FROM customers WHERE id = ?', [decoded.id]);
    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const customer = customers[0];

    if (customer.password) {
      const isMatch = await bcrypt.compare(currentPassword, customer.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE customers SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// NOTE: The old /reset-password endpoint was removed because it allowed anyone to reset
// any customer's password with just their email (no OTP/token verification).
// Use /forgot-password + /reset-password-with-otp instead.

// Generate random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = {}; // { email: { otp, expires, attempts } }
const OTP_MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Forgot Password - Send OTP
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;

    // Check if customer exists
    const [customers] = await db.query('SELECT id FROM customers WHERE email = ?', [email]);
    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found with this email. Please book a service first.' });
    }

    // Generate OTP
    const otp = generateOTP();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 minutes

    // Log OTP server-side only — NEVER send to client
    
    // TODO: Send OTP via email when SMTP is configured
    // For now it's only visible in server logs

    res.json({ 
      success: true, 
      message: 'If an account exists with this email, an OTP has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// Reset Password with OTP
router.post('/reset-password-with-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').notEmpty().withMessage('OTP is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;

    // Check OTP
    const storedOTP = otpStore[email];
    if (!storedOTP) {
      return res.status(400).json({ success: false, message: 'Please request a new OTP' });
    }
    if (Date.now() > storedOTP.expires) {
      delete otpStore[email];
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (storedOTP.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query('UPDATE customers SET password = ? WHERE email = ?', [hashedPassword, email]);

    // Clear OTP
    delete otpStore[email];

    res.json({ success: true, message: 'Password reset successfully! You can now login.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

module.exports = router;
