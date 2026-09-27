const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const db = require('../config/database');
const { sendBookingConfirmation, notifyAdminNewOrder, sendOrderStatusUpdate, later } = require('../config/email');
const crypto = require('crypto');
const auth = require('../middleware/auth');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

// SECURITY: a placeholder secret (the values shipped in .env.example are public)
// would let anyone forge a "valid" payment signature. Treat placeholders as unset.
const looksPlaceholder = (v) => !v || /^(your_|changeme|xxx|placeholder|rzp_test_xxx)/i.test(v) || v.length < 16;
const RAZORPAY_READY = !looksPlaceholder(RAZORPAY_KEY_SECRET) && !!RAZORPAY_KEY_ID;
if (!RAZORPAY_READY) {
  console.warn('Razorpay is NOT configured (missing/placeholder RAZORPAY_KEY_SECRET). Razorpay verification endpoints are disabled.');
}
if (looksPlaceholder(RAZORPAY_WEBHOOK_SECRET)) {
  console.warn('RAZORPAY_WEBHOOK_SECRET is missing/placeholder. Webhook will reject all events.');
}
const UTR_RE = /^[A-Za-z0-9\-]{6,64}$/;

// Validate Razorpay webhook signature
const validateWebhookSignature = (bodyBuffer, signature, secret) => {
  if (!signature || looksPlaceholder(secret)) return false;
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

    if (!RAZORPAY_READY) {
      return res.status(503).json({ success: false, message: 'Online payments are temporarily unavailable' });
    }

    if (booking.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID mismatch'
      });
    }

    // Idempotency: never re-process (or downgrade) a booking that is already paid.
    if (booking.payment_status === 'completed') {
      return res.json({ success: true, message: 'Payment already recorded', data: { booking_id, payment_status: 'completed' } });
    }

    const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(signaturePayload)
      .digest('hex');

    // Constant-time comparison (the webhook path already did this; this path did not).
    const sigOk = typeof razorpay_signature === 'string' &&
      razorpay_signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(Buffer.from(razorpay_signature), Buffer.from(expectedSignature));
    if (!sigOk) {
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

    // A valid signature proves Razorpay saw this order/payment pair — it does NOT
    // prove the money was captured or that the amount was right. Verify both with
    // the Razorpay API and refuse if we cannot.
    let paymentMethod = 'unknown';
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      const expectedPaise = Math.round(Number(booking.total_amount) * 100);
      if (!['captured', 'authorized'].includes(paymentDetails.status) ||
          paymentDetails.order_id !== razorpay_order_id ||
          Number(paymentDetails.amount) !== expectedPaise) {
        await logTransaction({ booking_id, transaction_type: 'razorpay_payment', razorpay_order_id, razorpay_payment_id,
          amount: booking.total_amount, status: 'failed',
          failure_reason: `Payment check failed: status=${paymentDetails.status} amount=${paymentDetails.amount} expected=${expectedPaise}` });
        return res.status(400).json({ success: false, message: 'Payment could not be verified with Razorpay' });
      }
      paymentMethod = paymentDetails.method || 'unknown'; // upi, card, netbanking, wallet
    } catch (fetchErr) {
      console.error('Could not verify payment with Razorpay:', fetchErr.message);
      return res.status(502).json({ success: false, message: 'Could not verify payment with Razorpay. If you were charged, contact support with your payment ID.' });
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
          // Cross-check the captured amount against what the booking actually costs
          // before marking it paid (a signed event for a ₹1 capture must not confirm
          // a ₹2000 booking).
          const [target] = await db.query(
            'SELECT booking_id, total_amount, payment_status FROM bookings WHERE razorpay_order_id = ? LIMIT 1', [orderId]
          );
          if (!target.length) { console.warn('Webhook for unknown order', orderId); break; }
          if (target[0].payment_status === 'completed') { break; } // already processed (Razorpay retries)
          const expectedPaise = Math.round(Number(target[0].total_amount) * 100);
          if (Number(payment.amount) !== expectedPaise) {
            console.error(`Webhook amount mismatch for ${target[0].booking_id}: got ${payment.amount}, expected ${expectedPaise}`);
            await logTransaction({ booking_id: target[0].booking_id, transaction_type: 'razorpay_webhook', razorpay_order_id: orderId,
              razorpay_payment_id: payment.id, amount: payment.amount / 100, status: 'failed', failure_reason: 'Amount mismatch' });
            break;
          }

          await db.query(`
            UPDATE bookings
            SET payment_status = 'completed',
                razorpay_payment_id = ?,
                payment_method = ?,
                payment_gateway = 'razorpay',
                payment_completed_at = CURRENT_TIMESTAMP,
                status = 'confirmed',
                updated_at = CURRENT_TIMESTAMP
            WHERE razorpay_order_id = ? AND payment_status <> 'completed'
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

    const paymentRef = String(transaction_id || transaction_reference).trim();
    if (!UTR_RE.test(paymentRef)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction reference format' });
    }

    // SECURITY (was High): anyone knowing a booking_id could overwrite the payment
    // state of ANY booking — including downgrading an already-paid Razorpay booking
    // back to pending and replacing the real payment id. Only allow the transition
    // from an unpaid state, and never touch a completed booking.
    const currentBooking = bookings[0];
    if (currentBooking.payment_status === 'completed') {
      return res.status(409).json({ success: false, message: 'This booking is already paid' });
    }
    if (!['pending', 'failed', 'pending_verification', null, undefined].includes(currentBooking.payment_status)) {
      return res.status(409).json({ success: false, message: 'Booking is not awaiting payment' });
    }

    await db.query(`
      UPDATE bookings 
      SET payment_status = 'pending_verification',
          payment_id = ?,
          payment_method = 'manual_upi',
          payment_gateway = 'manual_upi',
          updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = ? AND payment_status <> 'completed'
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

    const paymentRef = String(transaction_id || transaction_reference).trim();
    if (!UTR_RE.test(paymentRef)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction reference format' });
    }

    // SECURITY (was High): anyone knowing a booking_id could overwrite the payment
    // state of ANY booking — including downgrading an already-paid Razorpay booking
    // back to pending and replacing the real payment id. Only allow the transition
    // from an unpaid state, and never touch a completed booking.
    // BUGFIX: this route's query result is bookingData, not bookings; the old name
    // threw a ReferenceError, so every call 500'd before reaching the update.
    const currentBooking = bookingData[0];
    if (currentBooking.payment_status === 'completed') {
      return res.status(409).json({ success: false, message: 'This booking is already paid' });
    }
    if (!['pending', 'failed', 'pending_verification', null, undefined].includes(currentBooking.payment_status)) {
      return res.status(409).json({ success: false, message: 'Booking is not awaiting payment' });
    }

    await db.query(`
      UPDATE bookings 
      SET payment_status = 'pending_verification',
          payment_id = ?,
          payment_method = 'manual_upi',
          payment_gateway = 'manual_upi',
          updated_at = CURRENT_TIMESTAMP
      WHERE booking_id = ? AND payment_status <> 'completed'
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

// Create Razorpay order for a product purchase.
// SECURITY (was Critical): the amount used to come from the browser
// (`amount_paise`, hard-coded to 100 = Rs 1 by the product pages), and the order
// row used enum values the table rejects, so nothing was saved while the
// customer was told "Order confirmed". The amount is now computed on the server
// from product_catalog; items without a listed price cannot be paid online.
const formLimiterPay = require('express-rate-limit')({
  windowMs: 10 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later.' }
});
// Same rule as the product pages: a price is only charged when it is shown to
// customers; a sale price below the normal price wins.
const catalogPrice = (row) => {
  if (row.show_price !== undefined && row.show_price !== null && !Number(row.show_price)) return null;
  const p = Number(row.price);
  const d = Number(row.discount_price);
  if (p > 0 && d > 0 && d < p) return d;
  if (p > 0) return p;
  const pr = Number(String(row.price_range || '').replace(/[^0-9.]/g, ''));
  return pr > 0 && /^[\s₹Rs.,0-9]+$/i.test(String(row.price_range || '')) ? pr : null;
};

router.post('/product-order', formLimiterPay, async (req, res) => {
  try {
    const { name, phone, email, address, items, notes } = req.body;
    if (!name || !phone || !Array.isArray(items) || !items.length || items.length > 50) {
      return res.status(400).json({ success: false, message: 'Name, phone and items required' });
    }
    if (!RAZORPAY_READY) {
      return res.status(503).json({ success: false, message: 'Online payment is not available right now. Please choose Pay on Delivery or call us.' });
    }

    // Rebuild the basket from the catalog: only id + qty are taken from the client.
    const wanted = items.map(i => ({ id: parseInt(i.id, 10), qty: parseInt(i.qty, 10) }));
    if (wanted.some(i => !Number.isInteger(i.id) || i.id < 1 || !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 10000)) {
      return res.status(400).json({ success: false, message: 'Invalid items' });
    }
    const [rows] = await db.query(
      'SELECT id, brand, model, unit, price, price_range, discount_price, show_price, in_stock FROM product_catalog WHERE id IN (?)',
      [[...new Set(wanted.map(i => i.id))]]
    );
    const byId = new Map(rows.map(r => [r.id, r]));
    const basket = [];
    let totalRupees = 0;
    for (const w of wanted) {
      const row = byId.get(w.id);
      if (!row) return res.status(400).json({ success: false, message: 'One of the products is no longer available' });
      if (row.in_stock !== undefined && row.in_stock !== null && !Number(row.in_stock)) {
        return res.status(400).json({ success: false, message: `${row.brand} ${row.model} is out of stock right now. Please call us.` });
      }
      const unitPrice = catalogPrice(row);
      if (!unitPrice) {
        return res.status(400).json({ success: false, message: `${row.brand} ${row.model} has no listed price. Please choose Pay on Delivery or request a quote.` });
      }
      basket.push({ id: row.id, brand: row.brand, model: row.model, unit: row.unit, qty: w.qty, unit_price: unitPrice });
      totalRupees += unitPrice * w.qty;
    }
    const amountPaise = Math.round(totalRupees * 100);
    if (amountPaise < 100) return res.status(400).json({ success: false, message: 'Invalid order amount' });

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const receipt = 'prod_' + Date.now().toString().slice(-10);
    const order = await razorpay.orders.create({
      amount: amountPaise, currency: 'INR', receipt,
      notes: { customer: String(name).slice(0, 100), phone: String(phone).slice(0, 20) }
    });

    // Save as a pending order using values the table accepts. It becomes
    // 'confirmed' only after the payment is verified below.
    await db.query(
      'INSERT INTO product_orders (name,email,phone,address,items,notes,customer_type,status,razorpay_order_id,amount) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [String(name).slice(0, 255), email || '', String(phone).slice(0, 20), address || '', JSON.stringify(basket),
       ('Online payment. ' + (notes || '')).slice(0, 2000), 'customer', 'pending', order.id, totalRupees]
    );

    res.json({
      success: true,
      data: { order_id: order.id, amount: order.amount, currency: 'INR', key_id: RAZORPAY_KEY_ID, customer: { name, email: email || '', phone } }
    });
  } catch (err) {
    console.error('Product order creation error:', err.message);
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
    if (!RAZORPAY_READY) {
      return res.status(503).json({ success: false, message: 'Online payments are temporarily unavailable' });
    }
    const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
    const sigOk = typeof razorpay_signature === 'string' && razorpay_signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(razorpay_signature), Buffer.from(expected));
    if (!sigOk) return res.status(400).json({ success: false, message: 'Invalid payment signature' });

    const [orders] = await db.query('SELECT id, amount, status FROM product_orders WHERE razorpay_order_id = ? LIMIT 1', [razorpay_order_id]);
    if (!orders.length) return res.status(404).json({ success: false, message: 'Order not found. Please contact us with your payment ID.' });
    if (orders[0].status === 'confirmed') return res.json({ success: true, message: 'Payment already recorded', payment_id: razorpay_payment_id, order_id: orders[0].id });

    // Confirm with Razorpay that the money was actually captured for the right amount.
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const expectedPaise = Math.round(Number(orders[0].amount) * 100);
    if (!['captured', 'authorized'].includes(payment.status) || payment.order_id !== razorpay_order_id || Number(payment.amount) !== expectedPaise) {
      return res.status(400).json({ success: false, message: 'Payment could not be verified. Please contact us with your payment ID.' });
    }

    const [r] = await db.query(
      "UPDATE product_orders SET status='confirmed', payment_id=? WHERE razorpay_order_id=? AND status <> 'confirmed'",
      [razorpay_payment_id, razorpay_order_id]
    );
    res.json({ success: true, message: 'Payment verified. Order confirmed!', payment_id: razorpay_payment_id, order_id: orders[0].id, updated: r.affectedRows });
    if (r.affectedRows) {
      db.query('SELECT id, name, email, phone, address, items, amount FROM product_orders WHERE razorpay_order_id = ? LIMIT 1', [razorpay_order_id])
        .then(([[o]]) => {
          if (!o) return;
          const items = (() => { try { return JSON.parse(o.items); } catch (e) { return []; } })();
          later(notifyAdminNewOrder, { ...o, items, payment_method: 'Paid online' });
          later(sendOrderStatusUpdate, { ...o, items, status: 'confirmed' }); // customer confirmation
        })
        .catch(() => {});
    }
  } catch (err) {
    console.error('Product payment verify error:', err.message);
    res.status(500).json({ success: false, message: 'Payment verification failed. If you were charged, contact us with your payment ID.' });
  }
});

module.exports = router;
