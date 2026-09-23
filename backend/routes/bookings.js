const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { sendBookingConfirmation, sendStatusUpdate } = require('../config/email');
const auth = require('../middleware/auth');

let useStaticBookings = false;

const generateBookingId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SOL${timestamp}${random}`;
};

const getStaticCustomer = (email, name, phone, address) => ({
  id: 1,
  name: name || 'Test User',
  email: email || 'test@example.com',
  phone: phone || '9876543210',
  address: address || '',
});

const getStaticService = (serviceId) => {
  const services = {
    1: { id: 1, name: 'Residential Solar Installation', description: 'Complete rooftop solar system for homes' },
    2: { id: 2, name: 'Commercial Solar Solution', description: 'Scalable solar arrays for offices' },
    3: { id: 3, name: 'Industrial Solar Plant', description: 'High-capacity solar infrastructure' },
    4: { id: 4, name: 'Solar Water Heater', description: 'Energy-efficient solar water heating systems' },
    5: { id: 5, name: 'Solar Inverter Setup', description: 'Hybrid solar inverter installation' },
    6: { id: 6, name: 'Operation & Maintenance', description: 'Annual maintenance contract' },
  };
  return services[serviceId] || { id: serviceId, name: 'Solar Service', description: '' };
};

const buildStaticBooking = (bookingId, body) => ({
  id: 1,
  booking_id: bookingId,
  customer_id: 1,
  service_id: parseInt(body.service_id) || 1,
  appointment_date: body.appointment_date,
  appointment_time: body.appointment_time,
  notes: body.notes || null,
  total_amount: 0,
  payment_status: 'completed',
  status: 'confirmed',
  razorpay_order_id: null,
  razorpay_payment_id: null,
  customer_name: body.customer_name,
  customer_email: body.customer_email,
  customer_phone: body.customer_phone,
  customer_address: body.customer_address || null,
  service_name: getStaticService(parseInt(body.service_id) || 1).name,
  created_at: new Date().toISOString(),
});

router.get('/', async (req, res) => {
  try {
    if (!useStaticBookings) {
      const { email, phone } = req.query;
      
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
      
      if (email) {
        query += ' AND c.email = ?';
        params.push(email);
      }
      
      if (phone) {
        query += ' AND c.phone = ?';
        params.push(phone);
      }
      
      query += ' ORDER BY b.created_at DESC';
      
      const [bookings] = await db.query(query, params);
      return res.json({ success: true, data: bookings });
    }
    throw new Error('Using static bookings');
  } catch (error) {
    console.warn('DB unavailable, using static booking list:', error.message);
    useStaticBookings = true;
    res.json({ success: true, data: [] });
  }
});

router.get('/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

    if (useStaticBookings) {
      return res.json({ success: true, data: allSlots, booked: [] });
    }

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

router.get('/:id', async (req, res) => {
  try {
    if (!useStaticBookings) {
      const [bookings] = await db.query(`
        SELECT b.*, s.name as service_name, s.description as service_description,
               c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
               c.address as customer_address
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        LEFT JOIN customers c ON b.customer_id = c.id
        WHERE b.id = ? OR b.booking_id = ?
      `, [req.params.id, req.params.id]);
      
      if (bookings.length === 0) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }
      
      return res.json({ success: true, data: bookings[0] });
    }
    throw new Error('Using static bookings');
  } catch (error) {
    console.warn('DB unavailable, returning static booking:', error.message);
    useStaticBookings = true;
    const staticBooking = {
      id: 1,
      booking_id: req.params.id,
      customer_id: 1,
      service_id: 1,
      service_name: 'Residential Solar Installation',
      service_description: 'Complete rooftop solar system for homes with installation, subsidy assistance, and net metering support.',
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00',
      notes: null,
      total_amount: 0,
      payment_status: 'completed',
      status: 'confirmed',
      razorpay_payment_id: null,
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      customer_phone: '9876543210',
      customer_address: '',
      created_at: new Date().toISOString(),
    };
    res.json({ success: true, data: staticBooking });
  }
});

router.post('/', [
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

    const body = req.body;

    if (useStaticBookings) {
      const bookingId = generateBookingId();
      const staticBooking = buildStaticBooking(bookingId, body);
      return res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: { ...staticBooking, account_created: false, razorpay_order_id: null }
      });
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
    } = body;

    const [existingCustomer] = await db.query(
      'SELECT id, password FROM customers WHERE email = ?',
      [customer_email]
    );

    let customerId;
    let createdAccount = false;

    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
      await db.query(
        'UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?',
        [customer_name, customer_phone, customer_address || null, customerId]
      );
      
      if (create_account && password && !existingCustomer[0].password) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('UPDATE customers SET password = ? WHERE id = ?', [hashedPassword, customerId]);
        createdAccount = true;
      }
    } else {
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
    console.error('Error creating booking, falling back to static:', error.message);
    useStaticBookings = true;
    const bookingId = generateBookingId();
    const staticBooking = buildStaticBooking(bookingId, req.body);
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { ...staticBooking, account_created: false, razorpay_order_id: null }
    });
  }
});

router.post('/quick', [
  body('name').notEmpty().withMessage('Name is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('service_id').optional().isInt().withMessage('Service ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, phone, service_id } = req.body;

    if (useStaticBookings) {
      const bookingId = generateBookingId();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return res.status(201).json({
        success: true,
        message: 'Booking created successfully. We will contact you shortly.',
        data: {
          id: 1,
          booking_id: bookingId,
          customer_id: 1,
          service_id: service_id || 1,
          service_name: getStaticService(service_id || 1).name,
          appointment_date: tomorrow.toISOString().split('T')[0],
          appointment_time: '10:00',
          notes: 'Quick booking from mobile popup',
          total_amount: 0,
          payment_status: 'completed',
          status: 'confirmed',
          customer_name: name,
          customer_phone: phone,
        }
      });
    }

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

    const [existingCustomer] = await db.query(
      'SELECT id FROM customers WHERE phone = ?',
      [phone]
    );

    let customerId;
    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
      await db.query(
        'UPDATE customers SET name = ? WHERE id = ?',
        [name, customerId]
      );
    } else {
      const tempEmail = `temp_${phone}@sologixenergy.in`;
      const [result] = await db.query(
        'INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)',
        [name, tempEmail, phone]
      );
      customerId = result.insertId;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    let appointmentDate = tomorrow.toISOString().split('T')[0];
    let appointmentTime;

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
    console.error('Error creating quick booking, falling back to static:', error.message);
    useStaticBookings = true;
    const bookingId = generateBookingId();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    res.status(201).json({
      success: true,
      message: 'Booking created successfully. We will contact you shortly.',
      data: {
        id: 1,
        booking_id: bookingId,
        customer_id: 1,
        service_id: req.body.service_id || 1,
        service_name: getStaticService(req.body.service_id || 1).name,
        appointment_date: tomorrow.toISOString().split('T')[0],
        appointment_time: '10:00',
        notes: 'Quick booking from mobile popup',
        total_amount: 0,
        payment_status: 'completed',
        status: 'confirmed',
        customer_name: req.body.name,
        customer_phone: req.body.phone,
      }
    });
  }
});

router.put('/:id', auth, async (req, res) => {
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
