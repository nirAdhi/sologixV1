const express = require('express');
const router = express.Router();
const db = require('../config/database');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const { requirePermission } = require('../middleware/auth');
const canManage = requirePermission('manage_whatsapp');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

if (!VERIFY_TOKEN) {
  console.warn('WARNING: WHATSAPP_VERIFY_TOKEN not set, using default (change in production!)');
}

// Verify webhook origin - only accept from Meta/Facebook
const META_VERIFY_ORIGINS = ['graph.facebook.com', 'graph.whatsapp.com'];

// SECURITY (was Critical): the old check (a) returned TRUE whenever the header was
// simply omitted, (b) used the Graph API access token as the HMAC key — Meta signs
// with the APP SECRET — and (c) hashed JSON.stringify(req.body) instead of the raw
// bytes. Anyone could POST forged "inbound messages", making the business number
// send messages to arbitrary phones and overwrite customer records.
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET;
if (!WHATSAPP_APP_SECRET) {
  console.warn('WHATSAPP_APP_SECRET is not set — WhatsApp webhook POSTs will be rejected. Get it from Meta App Dashboard > App settings > Basic.');
}
function isValidWhatsAppRequest(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !WHATSAPP_APP_SECRET || !req.rawBody) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', WHATSAPP_APP_SECRET).update(req.rawBody).digest('hex');
  if (signature.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

const CONVERSATION_STEPS = {
  START: {
    question: 'Thank you for contacting Sologix Energy! ☀️\n\nWhat is your name?',
    next: 'ASK_PHONE',
    field: 'name'
  },
  ASK_PHONE: {
    question: 'Nice to meet you, {name}! 📱\n\nWhat is your phone number?',
    next: 'ASK_SERVICE',
    field: 'phone'
  },
  ASK_SERVICE: {
    question: 'Which service are you interested in?\n\n1. Residential Solar Installation\n2. Commercial Solar Installation\n3. Solar Water Heater\n4. Solar Inverter Setup\n5. Maintenance Service\n\nReply with the number (1-5)',
    next: 'ASK_PHOTO',
    field: 'service'
  },
  ASK_PHOTO: {
    question: 'Great! 📸\n\nWould you like to share a photo of your roof/property? (Send a photo or reply "skip" to continue)',
    next: 'ASK_DATE',
    field: 'photo_url'
  },
  ASK_DATE: {
    question: 'Great! 📅\n\nWhen would you like to schedule your appointment? (Please provide a preferred date)',
    next: 'ASK_ADDRESS',
    field: 'preferred_date'
  },
  ASK_ADDRESS: {
    question: 'Thank you! 📍\n\nWhat is your address? (Please provide your complete address)',
    next: 'ASK_EMAIL',
    field: 'address'
  },
  ASK_EMAIL: {
    question: 'Almost done! ✉️\n\nWhat is your email address? (Optional - for sending booking confirmation)',
    next: 'COMPLETE',
    field: 'email'
  },
  COMPLETE: {
    question: null,
    next: null,
    field: null
  }
};

const SERVICE_MAP = {
  '1': { id: 1, name: 'Residential Solar Installation', price: 150000 },
  '2': { id: 2, name: 'Commercial Solar Installation', price: 500000 },
  '3': { id: 3, name: 'Solar Water Heater', price: 25000 },
  '4': { id: 4, name: 'Solar Inverter Setup', price: 35000 },
  '5': { id: 5, name: 'Solar Panel Maintenance', price: 2000 }
};

async function sendWhatsAppMessage(phone, message) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.log('WhatsApp not configured, skipping message:', message);
    return null;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message }
      })
    });

    const data = await response.json();
    console.log('WhatsApp message sent:', data);
    return data.messages?.[0]?.id;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return null;
  }
}

async function saveMessage(phone, message, direction, bookingId = null, whatsappId = null, imageUrl = null) {
  await db.query(
    `INSERT INTO whatsapp_messages (phone, booking_id, message, direction, whatsapp_message_id, image_url) VALUES (?, ?, ?, ?, ?, ?)`,
    [phone, bookingId, message, direction, whatsappId, imageUrl]
  );
}

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const tokenOk = typeof token === 'string' && typeof VERIFY_TOKEN === 'string' && VERIFY_TOKEN.length > 0 &&
    token.length === VERIFY_TOKEN.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(VERIFY_TOKEN));
  if (mode === 'subscribe' && tokenOk) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

router.post('/webhook', async (req, res) => {
  try {
    // Verify request is from Meta
    if (!isValidWhatsAppRequest(req)) {
      console.warn('Invalid WhatsApp webhook signature');
      return res.sendStatus(403);
    }
    
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const phone = message.from;
    const messageId = message.id;
    let text = message.text?.body?.trim() || '';
    let imageUrl = null;

    // Handle image messages
    if (message.type === 'image') {
      const imageId = message.image?.id;
      if (imageId && WHATSAPP_TOKEN) {
        try {
          // Get image URL from WhatsApp API
          const imageResponse = await fetch(`https://graph.facebook.com/v18.0/${imageId}`, {
            headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` }
          });
          const imageData = await imageResponse.json();
          imageUrl = imageData.url;
          text = '[IMAGE]';
        } catch (err) {
          console.error('Error fetching image:', err);
          text = '[IMAGE]';
        }
      } else {
        text = '[IMAGE] - Please send photos after booking is confirmed';
      }
    }

    console.log('Received WhatsApp message:', phone, text, imageUrl ? '(with image)' : '');

    await saveMessage(phone, text, 'INBOUND', null, messageId, imageUrl);

    await handleIncomingMessage(phone, text, imageUrl);

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

async function handleIncomingMessage(phone, text, imageUrl = null) {
  const [conversations] = await db.query(
    `SELECT * FROM whatsapp_conversations WHERE phone = ?`,
    [phone]
  );

  let conversation = conversations[0];
  const upperText = text.toUpperCase();

  // Check for quick replies first
  const [quickReplies] = await db.query(
    `SELECT * FROM whatsapp_quick_replies WHERE UPPER(keyword) = ?`,
    [upperText]
  );

  if (quickReplies.length > 0 && !conversation) {
    const reply = quickReplies[0];
    await sendWhatsAppMessage(phone, reply.response);
    await saveMessage(phone, reply.response, 'OUTBOUND');
    
    if (reply.action === 'START') {
      await db.query(
        `INSERT INTO whatsapp_conversations (phone, current_step, temp_data) VALUES (?, ?, ?)`,
        [phone, 'START', JSON.stringify({})]
      );
      const newConversation = {
        current_step: 'START',
        temp_data: {}
      };
      await processStep(phone, newConversation, text);
    }
    return;
  }

  // Check for new conversation
  if (!conversation || conversation.current_step === 'COMPLETE' || conversation.current_step === 'START') {
    if (upperText === 'BOOKING' || upperText === 'BOOK' || upperText === 'START') {
      await db.query(
        `INSERT INTO whatsapp_conversations (phone, current_step, temp_data) VALUES (?, ?, ?)`,
        [phone, 'START', JSON.stringify({})]
      );
      conversation = {
        current_step: 'START',
        temp_data: {}
      };
    } else {
      const defaultMsg = `Welcome to Sologix Energy! ☀️\n\nWe help you switch to clean solar energy.\n\nReply with:\n- *BOOKING* - Book a consultation\n- *SERVICES* - View our services\n- *CONTACT* - Get contact info\n- *HELP* - Get help`;
      await sendWhatsAppMessage(phone, defaultMsg);
      await saveMessage(phone, defaultMsg, 'OUTBOUND');
      return;
    }
  }

  await processStep(phone, conversation, text, imageUrl);
}

async function processStep(phone, conversation, text, imageUrl = null) {
  const currentStep = conversation.current_step;
  const stepConfig = CONVERSATION_STEPS[currentStep];
  const tempData = typeof conversation.temp_data === 'string' 
    ? JSON.parse(conversation.temp_data) 
    : conversation.temp_data || {};
  const upperText = text ? text.toUpperCase() : '';

  if (!stepConfig) {
    console.log('Unknown step:', currentStep);
    return;
  }

  // Handle photo step specially
  if (currentStep === 'ASK_PHOTO') {
    if (upperText === 'SKIP' || upperText === 'SKIP') {
      tempData.photo_url = null;
    } else if (imageUrl) {
      tempData.photo_url = imageUrl;
    } else {
      // Ask again for photo or skip
      const photoMsg = 'Please send a photo of your roof/property or reply "skip" to continue.';
      await sendWhatsAppMessage(phone, photoMsg);
      await saveMessage(phone, photoMsg, 'OUTBOUND');
      return;
    }
  } else if (stepConfig.field) {
    tempData[stepConfig.field] = text;
  }

  // Update conversation with new data
  await db.query(
    `UPDATE whatsapp_conversations SET temp_data = ? WHERE phone = ?`,
    [JSON.stringify(tempData), phone]
  );

  // Move to next step or complete
  if (stepConfig.next) {
    const nextStep = stepConfig.next;
    await db.query(
      `UPDATE whatsapp_conversations SET current_step = ? WHERE phone = ?`,
      [nextStep, phone]
    );

    // Generate next question
    let question = CONVERSATION_STEPS[nextStep].question;
    if (question && tempData.name) {
      question = question.replace('{name}', tempData.name);
    }

    if (question) {
      await sendWhatsAppMessage(phone, question);
      await saveMessage(phone, question, 'OUTBOUND');
    }

    // If completing, create booking
    if (nextStep === 'COMPLETE') {
      await createBookingFromWhatsApp(phone, tempData);
    }
  }
}

async function createBookingFromWhatsApp(phone, tempData) {
  try {
    // Determine service ID
    let serviceId = 1; // default residential
    if (tempData.service) {
      const serviceNum = tempData.service.replace(/[^1-5]/g, '');
      if (SERVICE_MAP[serviceNum]) {
        serviceId = SERVICE_MAP[serviceNum].id;
      }
    }

    // Check if customer exists
    const [existing] = await db.query(
      `SELECT id FROM customers WHERE phone = ?`,
      [phone]
    );

    let customerId;
    if (existing.length > 0) {
      customerId = existing[0].id;
      await db.query(
        `UPDATE customers SET name = ?, email = ?, address = ? WHERE id = ?`,
        [tempData.name, tempData.email || null, tempData.address || null, customerId]
      );
    } else {
      const [result] = await db.query(
        `INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)`,
        [tempData.name, tempData.email || null, phone, tempData.address || null]
      );
      customerId = result.insertId;
    }

    // Generate booking ID
    // SECURITY: booking_id is a bearer credential (it unlocks the public booking
    // lookup and payment endpoints), so it must be unguessable — same scheme as
    // routes/bookings.js, not Math.random().
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(6).toString('hex').toUpperCase(); // 48 bits
    const bookingId = `SOL${timestamp}${random}`;

    // Parse date
    let appointmentDate = new Date();
    if (tempData.preferred_date) {
      const parsed = new Date(tempData.preferred_date);
      if (!isNaN(parsed.getTime())) {
        appointmentDate = parsed;
      }
    }

    // Create booking
    await db.query(
      `INSERT INTO bookings (booking_id, customer_id, service_id, appointment_date, appointment_time, notes, total_amount, status, payment_status)
       VALUES (?, ?, ?, ?, '10:00:00', ?, 2000.00, 'pending', 'pending')`,
      [bookingId, customerId, serviceId, appointmentDate.toISOString().split('T')[0], 'Booked via WhatsApp']
    );

    const confirmMsg = `🎉 *Booking Confirmed!*\n\nDear ${tempData.name},\n\nYour solar consultation has been booked!\n\n📋 *Booking ID:* ${bookingId}\n📅 *Date:* ${appointmentDate.toLocaleDateString('en-IN')}\n⏰ *Time:* 10:00 AM\n\nOur team will contact you shortly to confirm the details.\n\n💰 *Booking Fee:* ₹2,000\n\nThank you for choosing Sologix Energy! ☀️`;

    await sendWhatsAppMessage(phone, confirmMsg);
    await saveMessage(phone, confirmMsg, 'OUTBOUND', bookingId);

    // Clear conversation
    await db.query(
      `UPDATE whatsapp_conversations SET current_step = 'COMPLETE' WHERE phone = ?`,
      [phone]
    );

    console.log('WhatsApp booking created:', bookingId);
  } catch (error) {
    console.error('Error creating WhatsApp booking:', error);
    const errorMsg = 'Sorry, there was an error creating your booking. Our team will contact you shortly.';
    await sendWhatsAppMessage(phone, errorMsg);
  }
}

// API to get WhatsApp conversations for admin (requires auth)
router.get('/conversations', auth, canManage, async (req, res) => {
  try {
    const [conversations] = await db.query(
      `SELECT * FROM whatsapp_conversations ORDER BY updated_at DESC LIMIT 50`
    );
    res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
});

// API to get messages for a phone number (admin only)
router.get('/messages/:phone', auth, canManage, async (req, res) => {
  try {
    const [messages] = await db.query(
      `SELECT * FROM whatsapp_messages WHERE phone = ? ORDER BY created_at ASC`,
      [req.params.phone]
    );
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// API to manually start a conversation (admin only)
router.post('/start-conversation', auth, canManage, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }

    await db.query(
      `INSERT INTO whatsapp_conversations (phone, current_step, temp_data) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE current_step = 'START', temp_data = '{}'`,
      [phone, 'START', '{}']   // BUGFIX: 3 placeholders but only 2 values -> this endpoint always returned 500
    );

    const welcomeMsg = `Welcome to Sologix Energy! ☀️\n\nLet's book your solar consultation.\n\nWhat is your name?`;

    await sendWhatsAppMessage(phone, welcomeMsg);
    await saveMessage(phone, welcomeMsg, 'OUTBOUND');

    res.json({ success: true, message: 'Conversation started' });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to start conversation' });
  }
});

// API to get quick replies management (admin only)
router.get('/quick-replies', auth, async (req, res) => {
  try {
    const [replies] = await db.query(`SELECT * FROM whatsapp_quick_replies`);
    res.json({ success: true, data: replies });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quick replies' });
  }
});

router.post('/quick-replies', auth, canManage, async (req, res) => {
  try {
    const { keyword, response, action } = req.body;
    await db.query(
      `INSERT INTO whatsapp_quick_replies (keyword, response, action) VALUES (?, ?, ?)`,
      [keyword, response, action || null]
    );
    res.json({ success: true, message: 'Quick reply added' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add quick reply' });
  }
});

router.delete('/quick-replies/:id', auth, canManage, async (req, res) => {
  try {
    await db.query(`DELETE FROM whatsapp_quick_replies WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Quick reply deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete quick reply' });
  }
});

module.exports = router;
