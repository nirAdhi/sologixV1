const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const db = require('../config/database');
const { sendBookingConfirmation } = require('../config/email');
const crypto = require('crypto');
const auth = require('../middleware/auth');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// Validate Razorpay webhook signature
const validateWebhookSignature = (bodyBuffer, signature, secret) => {
  if (!signature || !secret) return false;
  try {
    const bodyString = typeof bodyBuffer === 'string' ? bodyBuffer : bodyBuffer.toString('utf8');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex');
    // Use timing-safe comparison — both must be same length
    if (signature.length !== expectedSignature.length) return false;
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    console.error('Webhook signature validation error:', err.message);
    return false;
  }
};

// Helper: log a transaction to payment_transactions table
async function logTransaction(data) {
  try {
    await db.query(`
      INSERT INTO payment_transactions 
      (booking_id, transaction_type, razorpay_order_id, razorpay_payment_id, payment_method, amount, currency, status, failure_reason, gateway_response)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.booking_id,
      data.transaction_type,
      data.razorpay_order_id || null,
      data.razorpay_payment_id || null,
      data.payment_method || null,
      data.amount || null,
      data.currency || 'INR',
      data.status,
      data.failure_reason || null,
      data.gateway_response ? JSON.stringify(data.gateway_response) : null
    ]);
  } catch (err) {
    console.error('Failed to log transaction:', err.message);
  }
}

// Create Razorpay order
router.post('/create-razorpay-order', auth, async (req, res) => {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking ID is required' 
      });
    }

    const [bookings] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name, c.phone as customer_phone,
             s.name as service_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      WHERE b.booking_id = ?
    `, [booking_id]);

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const booking = bookings[0];

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        success: false,
        message: 'Razorpay is not configured. Please use UPI payment.'
      });
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });

    const amount = Math.round(booking.total_amount * 100);

    const order = await razorpay.orders.create({
      amount: amount,
      currency: 'INR',
      receipt: `booking_${booking.booking_id}`,
      notes: {
        booking_id: booking.booking_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        service_name: booking.service_name
      }
    });

    await db.query(`
      UPDATE bookings 
      SET razorpay_order_id = ?, payment_gateway = 'razorpay'
      WHERE booking_id = ?
    `, [order.id, booking_id]);

    // Log the order creation
    await logTransaction({
      booking_id: booking.booking_id,
      transaction_type: 'razorpay_order',
      razorpay_order_id: order.id,
      amount: booking.total_amount,
      currency: 'INR',
      status: 'created',
      gateway_response: { order_id: order.id, receipt: order.receipt }
    });

    res.json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID,
        booking_id: booking.booking_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone
      }
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

// Verify Razorpay payment
router.post('/verify-razorpay-payment', async (req, res) => {
  try {
    const { 
      booking_id, 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature 
    } = req.body;

    if (!booking_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ 
        success: false, 
        message: 'All payment details are required' 
      });
    }

    const [bookings] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.booking_id = ?
    `, [booking_id]);

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const booking = bookings[0];

    if (booking.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID mismatch'
      });
    }

    const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(signaturePayload)
      .digest('hex');

    if (razorpay_signature !== expectedSignature) {
      // Log failed verification
      await logTransaction({
        booking_id: booking_id,
        transaction_type: 'razorpay_payment',
        razorpay_order_id,
        razorpay_payment_id,
        amount: booking.total_amount,
        status: 'failed',
        failure_reason: 'Invalid payment signature',
        gateway_response: { razorpay_order_id, razorpay_payment_id, signature_mismatch: true }
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Fetch payment details from Razorpay to get payment method
    let paymentMethod = 'unknown';
    try {
      if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
        const Razorpay = require('razorpay');
        const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
        const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
        paymentMethod = paymentDetails.method || 'unknown'; // upi, card, netbanking, wallet
      }
    } catch (fetchErr) {
      console.warn('Could not fetch payment method from Razorpay:', fetchErr.message);
    }

    await db.query(`
      UPDATE bookings 
      SET payment_status = 'completed',
          payment_id = ?,
          razorpay_payment_id = ?,
          payment_method = ?,
          payment_gateway = 'razorpay',
          payment_completed_at = CURRENT_TIMESTAMP,
          status = 'confirmed',
          updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = ?
    `, [razorpay_payment_id, razorpay_payment_id, paymentMethod, booking_id]);

    // Log successful payment
    await logTransaction({
      booking_id: booking_id,
      transaction_type: 'razorpay_payment',
      razorpay_order_id,
      razorpay_payment_id,
      payment_method: paymentMethod,
      amount: booking.total_amount,
      status: 'captured',
      gateway_response: { razorpay_order_id, razorpay_payment_id, method: paymentMethod }
    });

    res.json({
      success: true,
      message: 'Payment successful! Your booking is confirmed.',
      data: {
        booking_id: booking_id,
        payment_status: 'completed',
        payment_id: razorpay_payment_id,
        payment_method: paymentMethod
      }
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
});

// Razorpay webhook endpoint
router.post('/razorpay-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    if (!validateWebhookSignature(req.body, signature, RAZORPAY_WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // req.body is a Buffer from express.raw() — convert to string then parse
    const bodyString = typeof req.body === 'string' ? req.body : req.body.toString('utf8');
    const event = JSON.parse(bodyString);

    switch (event.event) {
      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        const paymentMethod = payment.method || 'unknown';
        
        if (orderId) {
          await db.query(`
            UPDATE bookings 
            SET payment_status = 'completed',
                razorpay_payment_id = ?,
                payment_method = ?,
                payment_gateway = 'razorpay',
                payment_completed_at = CURRENT_TIMESTAMP,
                status = 'confirmed',
                updated_at = CURRENT_TIMESTAMP
            WHERE razorpay_order_id = ?
          `, [payment.id, paymentMethod, orderId]);

          // Get booking_id for logging
          const [bookingRows] = await db.query(
            'SELECT booking_id FROM bookings WHERE razorpay_order_id = ?', [orderId]
          );
          const bookingId = bookingRows[0]?.booking_id || orderId;

          await logTransaction({
            booking_id: bookingId,
            transaction_type: 'razorpay_webhook',
            razorpay_order_id: orderId,
            razorpay_payment_id: payment.id,
            payment_method: paymentMethod,
            amount: payment.amount / 100,
            status: 'captured',
            gateway_response: {
              event: event.event,
              method: paymentMethod,
              email: payment.email,
              contact: payment.contact,
              card_id: payment.card_id,
              bank: payment.bank,
              vpa: payment.vpa
            }
          });
        }
        break;
      }

      case 'payment.failed': {
        const failedPayment = event.payload.payment.entity;
        const failedOrderId = failedPayment.order_id;
        const failureReason = failedPayment.error_description || failedPayment.error_reason || 'Payment failed';
        
        if (failedOrderId) {
          await db.query(`
            UPDATE bookings 
            SET payment_status = 'failed',
                razorpay_payment_id = ?,
                payment_failure_reason = ?,
                payment_gateway = 'razorpay',
                updated_at = CURRENT_TIMESTAMP
            WHERE razorpay_order_id = ?
          `, [failedPayment.id, failureReason, failedOrderId]);

          // Get booking_id for logging
          const [bookingRows] = await db.query(
            'SELECT booking_id FROM bookings WHERE razorpay_order_id = ?', [failedOrderId]
          );
          const bookingId = bookingRows[0]?.booking_id || failedOrderId;

          await logTransaction({
            booking_id: bookingId,
            transaction_type: 'razorpay_webhook',
            razorpay_order_id: failedOrderId,
            razorpay_payment_id: failedPayment.id,
            payment_method: failedPayment.method || 'unknown',
            amount: failedPayment.amount / 100,
            status: 'failed',
            failure_reason: failureReason,
            gateway_response: {
              event: event.event,
              error_code: failedPayment.error_code,
              error_description: failedPayment.error_description,
              error_source: failedPayment.error_source,
              error_step: failedPayment.error_step,
              error_reason: failedPayment.error_reason
            }
          });
        }
        break;
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

router.post('/upi-details', async (req, res) => {
  try {
    const { booking_id } = req.body;

    const [bookings] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name, c.phone as customer_phone,
             s.name as service_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      WHERE b.booking_id = ?
    `, [booking_id]);

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const booking = bookings[0];

    const upiId = process.env.UPI_ID || 'sologixenergy@ybl';
    const upiName = process.env.UPI_NAME || 'Sologix Energy';
    const amount = booking.total_amount;

    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Booking ' + booking.booking_id)}&tr=${booking.booking_id}`;

    const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#059669',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      data: {
        upi_id: upiId,
        upi_name: upiName,
        amount: amount,
        qr_code: qrCodeDataUrl,
        upi_link: upiString,
        booking_id: booking.booking_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email
      }
    });
  } catch (error) {
    console.error('Error generating UPI details:', error);
    res.status(500).json({ success: false, message: 'Failed to generate payment details' });
  }
});

router.post('/verify-upi', async (req, res) => {
  try {
    const { booking_id, transaction_id, transaction_reference } = req.body;

    if (!transaction_id && !transaction_reference) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide transaction ID or reference number' 
      });
    }

    const [bookings] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE b.booking_id = ?
    `, [booking_id]);

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const paymentRef = transaction_id || transaction_reference;

    await db.query(`
      UPDATE bookings 
      SET payment_status = 'pending_verification',
          payment_id = ?,
          payment_method = 'manual_upi',
          payment_gateway = 'manual_upi',
          status = 'pending',
          updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = ?
    `, [paymentRef, booking_id]);

    // Log manual UPI transaction
    await logTransaction({
      booking_id: booking_id,
      transaction_type: 'manual_upi',
      payment_method: 'manual_upi',
      amount: bookings[0].total_amount,
      status: 'authorized',
      gateway_response: { transaction_id: paymentRef, type: 'manual_upi_submission' }
    });

    res.json({
      success: true,
      message: 'Payment details submitted. Our team will verify and confirm your booking shortly.'
    });
  } catch (error) {
    console.error('Error verifying UPI payment:', error);
    res.status(500).json({ success: false, message: 'Failed to submit payment details' });
  }
});

router.post('/create-order', async (req, res) => {
  try {
    const { booking_id } = req.body;

    const [bookings] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name, c.phone as customer_phone,
             s.name as service_name
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      WHERE b.booking_id = ?
    `, [booking_id]);

    if (bookings.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const booking = bookings[0];

    const upiId = process.env.UPI_ID || 'sologixenergy@ybl';
    const upiName = process.env.UPI_NAME || 'Sologix Energy';
    const amount = booking.total_amount;

    const upiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Booking ' + booking.booking_id)}&tr=${booking.booking_id}`;

    const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#059669',
        light: '#ffffff'
      }
    });

    res.json({
      success: true,
      data: {
        upi_payment: true,
        upi_id: upiId,
        upi_name: upiName,
        amount: amount,
        qr_code: qrCodeDataUrl,
        upi_link: upiString,
        booking_id: booking.booking_id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { booking_id, transaction_id, transaction_reference } = req.body;

    if (!transaction_id && !transaction_reference) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide transaction ID or reference number' 
      });
    }

    const [bookingData] = await db.query(`
      SELECT b.*, c.email as customer_email, c.name as customer_name, c.phone as customer_phone,
             c.address as customer_address, s.name as service_name, s.description as service_description,
             s.duration_hours
      FROM bookings b
      LEFT JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      WHERE b.booking_id = ?
    `, [booking_id]);

    if (bookingData.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const paymentRef = transaction_id || transaction_reference;

    await db.query(`
      UPDATE bookings 
      SET payment_status = 'pending_verification',
          payment_id = ?,
          payment_method = 'manual_upi',
          payment_gateway = 'manual_upi',
          status = 'pending',
          updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = ?
    `, [paymentRef, booking_id]);

    const booking = bookingData[0];
    booking.payment_status = 'pending_verification';
    booking.payment_id = paymentRef;

    // Log manual UPI transaction
    await logTransaction({
      booking_id: booking_id,
      transaction_type: 'manual_upi',
      payment_method: 'manual_upi',
      amount: booking.total_amount,
      status: 'authorized',
      gateway_response: { transaction_id: paymentRef, type: 'manual_upi_verification' }
    });

    res.json({
      success: true,
      message: 'Payment submitted for verification. You will receive confirmation shortly.',
      data: booking
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
});


// ─────────────────────────────────────────────
// PRODUCT ORDER PAYMENT (e-commerce Buy Now)
// ─────────────────────────────────────────────

// Create Razorpay order for a product purchase
router.post('/product-order', async (req, res) => {
  try {
    const { name, phone, email, address, items, amount_paise, notes } = req.body;
    if (!name || !phone || !items?.length || !amount_paise) {
      return res.status(400).json({ success: false, message: 'Name, phone, items and amount required' });
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ success: false, message: 'Payment gateway not configured' });
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

    const receipt = 'prod_' + Date.now().toString().slice(-10);
    const order = await razorpay.orders.create({
      amount: amount_paise,
      currency: 'INR',
      receipt,
      notes: { customer: name, phone, items: JSON.stringify(items).slice(0, 512) }
    });

    // Save order as pending in product_orders
    const itemsJson = JSON.stringify(items);
    const amountInRupees = amount_paise / 100;
    try {
      await db.query(
        'INSERT INTO product_orders (name,email,phone,address,items,notes,customer_type,status,razorpay_order_id) VALUES (?,?,?,?,?,?,?,?,?)',
        [name, email||'', phone, address||'', itemsJson, notes||'', 'direct_order', 'payment_pending', order.id]
      );
    } catch(dbErr) { console.warn('DB save failed (may not have razorpay_order_id col):', dbErr.message); }

    res.json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: 'INR',
        key_id: RAZORPAY_KEY_ID,
        customer: { name, email: email||'', phone }
      }
    });
  } catch (err) {
    console.error('Product order creation error:', err);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
});

// Verify product order payment
router.post('/product-order/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'All payment fields required' });
    }

    const expected = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Update order status to confirmed
    try {
      await db.query(
        'UPDATE product_orders SET status=?, payment_id=? WHERE razorpay_order_id=?',
        ['confirmed', razorpay_payment_id, razorpay_order_id]
      );
    } catch(dbErr) { console.warn('DB update failed:', dbErr.message); }

    res.json({ success: true, message: 'Payment verified. Order confirmed!', payment_id: razorpay_payment_id });
  } catch (err) {
    console.error('Product payment verify error:', err);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

module.exports = router;
