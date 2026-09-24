// Email sending for Sologix.
//
// SMTP credentials come ONLY from .env (SMTP_HOST, SMTP_PORT, SMTP_USER,
// SMTP_PASS, optional SMTP_FROM). What gets sent, the sender name, reply-to and
// the address that receives admin notifications are set in Admin > Email &
// Integrations and stored in site_settings under the private key
// 'email_settings' (defaults come from .env).
const nodemailer = require('nodemailer');
const db = require('./database');
const { publicConfig, smtpConfigured, clean } = require('./siteConfig');

// ---------- helpers ----------
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;
// SECURITY: nodemailer accepts comma-separated lists; a stored "a@x.com, b@y.com"
// would copy the email to a second address.
function singleRecipient(addr) {
  const a = String(addr || '').trim();
  if (!EMAIL_RE.test(a)) throw new Error('Invalid recipient address');
  return a;
}
function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const mask = (a) => String(a || '').replace(/^(.).*(@.*)$/, '$1***$2');
const isTempEmail = (a) => /^temp_\d+@/i.test(String(a || '')); // quick-booking placeholder addresses
const fmtDate = (d) => {
  try { return new Date(d).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
  catch (e) { return String(d || ''); }
};
const fmtTime = (t) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t || ''));
  if (!m) return String(t || '');
  const h = Number(m[1]);
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
};

// ---------- SMTP from .env ----------
function smtpEnv() {
  const port = Number(process.env.SMTP_PORT) || 587;
  // SMTP_SECURE=true forces SSL/TLS from the first byte (normally only port 465),
  // SMTP_SECURE=false forces STARTTLS. Empty = decide by port.
  const forced = clean(process.env.SMTP_SECURE).toLowerCase();
  return {
    host: clean(process.env.SMTP_HOST) || 'smtp.gmail.com',
    port,
    secure: forced === 'true' ? true : forced === 'false' ? false : port === 465,
    user: clean(process.env.SMTP_USER),
    pass: String(process.env.SMTP_PASS || ''),
    from: clean(process.env.SMTP_FROM) || clean(process.env.SMTP_USER),
  };
}
let transporter = null;
let transporterKey = '';
function getTransporter() {
  if (!smtpConfigured()) return null;
  const e = smtpEnv();
  const key = [e.host, e.port, e.user, e.pass].join('|');
  if (!transporter || key !== transporterKey) {
    transporter = nodemailer.createTransport({
      host: e.host,
      port: e.port,
      secure: e.secure,        // implicit TLS on 465
      requireTLS: !e.secure,   // STARTTLS must succeed on 587 (no plaintext downgrade)
      auth: { user: e.user, pass: e.pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      ...(process.env.SMTP_TLS_REJECT_UNAUTHORIZED === 'false' ? { tls: { rejectUnauthorized: false } } : {}),
    });
    transporterKey = key;
  }
  return transporter;
}

// ---------- settings (admin page) ----------
const SETTINGS_KEY = 'email_settings';
const TOGGLES = ['customer_booking_confirmation', 'customer_status_updates', 'admin_new_booking', 'admin_new_lead', 'admin_new_order'];
function defaultSettings() {
  const pc = publicConfig();
  return {
    customer_booking_confirmation: true,
    customer_status_updates: true,
    admin_new_booking: true,
    admin_new_lead: true,
    admin_new_order: true,
    from_name: clean(process.env.MAIL_FROM_NAME) || pc.name,
    reply_to: clean(process.env.MAIL_REPLY_TO) || pc.email,
    admin_notify_email: clean(process.env.ADMIN_NOTIFY_EMAIL) || pc.email,
  };
}
let settingsCache = null;
let settingsAt = 0;
async function getSettings() {
  if (settingsCache && Date.now() - settingsAt < 30000) return settingsCache;
  let saved = {};
  try {
    const [rows] = await db.query('SELECT `value` FROM site_settings WHERE `key` = ?', [SETTINGS_KEY]);
    if (rows.length) saved = JSON.parse(rows[0].value) || {};
  } catch (e) { /* table missing or DB down: use defaults */ }
  settingsCache = { ...defaultSettings(), ...saved };
  settingsAt = Date.now();
  return settingsCache;
}
function validateSettings(input) {
  const out = {};
  for (const k of TOGGLES) if (input[k] !== undefined) out[k] = input[k] === true || input[k] === 'true' || input[k] === 1;
  if (input.from_name !== undefined) {
    const v = clean(input.from_name).replace(/["<>\r\n]/g, '').slice(0, 80);
    if (!v) throw Object.assign(new Error('Sender name cannot be empty'), { status: 400 });
    out.from_name = v;
  }
  for (const k of ['reply_to', 'admin_notify_email']) {
    if (input[k] === undefined) continue;
    const v = clean(input[k]);
    if (v && !EMAIL_RE.test(v)) throw Object.assign(new Error(`${k === 'reply_to' ? 'Reply-to' : 'Notification'} address is not a valid email`), { status: 400 });
    out[k] = v;
  }
  return out;
}
async function saveSettings(input) {
  const current = await getSettings();
  const next = { ...current, ...validateSettings(input) };
  const value = JSON.stringify(next);
  await db.query('INSERT INTO site_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', [SETTINGS_KEY, value, value]);
  settingsCache = next;
  settingsAt = Date.now();
  return next;
}

// ---------- recent activity (memory only, for the admin page) ----------
const recent = [];
let lastError = null;
function record(entry) {
  recent.unshift({ at: new Date().toISOString(), ...entry });
  if (recent.length > 30) recent.pop();
}

// ---------- core send ----------
async function send(kind, { to, subject, html, text }, { throwOnError = false } = {}) {
  const t = getTransporter();
  if (!t) {
    record({ kind, to: mask(to), subject, ok: false, skipped: true, error: 'Email is not set up in .env' });
    console.log(`Email not configured, skipping ${kind}`);
    if (throwOnError) throw Object.assign(new Error('Email is not set up. Add SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS to .env and restart.'), { status: 400 });
    return { ok: false, skipped: true };
  }
  const s = await getSettings();
  const e = smtpEnv();
  try {
    const info = await t.sendMail({
      from: { name: s.from_name, address: e.from },
      to: singleRecipient(to),
      replyTo: s.reply_to && EMAIL_RE.test(s.reply_to) ? s.reply_to : undefined,
      subject,
      html,
      text,
    });
    record({ kind, to: mask(to), subject, ok: true });
    lastError = null;
    console.log(`Email sent: ${kind} to ${mask(to)}`);
    return { ok: true, messageId: info && info.messageId };
  } catch (err) {
    const msg = String(err && (err.response || err.message) || err).slice(0, 300);
    record({ kind, to: mask(to), subject, ok: false, error: msg });
    lastError = { at: new Date().toISOString(), message: msg };
    console.error(`Email failed: ${kind} to ${mask(to)}: ${msg}`);
    if (throwOnError) throw Object.assign(new Error(msg), { status: 502 });
    return { ok: false, error: msg };
  }
}

// ---------- templates ----------
function layout(title, bodyHtml, preheader = '') {
  const pc = publicConfig();
  const wa = pc.whatsapp ? `https://wa.me/${pc.whatsapp}` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
<span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#006948;padding:22px 28px;color:#ffffff;">
  <div style="font-size:20px;font-weight:bold;">☀️ ${escapeHtml(pc.name)}</div>
  <div style="font-size:13px;opacity:.85;">Energizing Naturally</div>
</td></tr>
<tr><td style="padding:28px;font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
<tr><td style="background:#f9fafb;padding:18px 28px;font-size:12px;color:#6b7280;line-height:1.7;border-top:1px solid #e5e7eb;">
  📞 <a href="tel:${escapeHtml(pc.phone.replace(/\s/g, ''))}" style="color:#006948;text-decoration:none;">${escapeHtml(pc.phone)}</a>
  ${wa ? ` &nbsp;|&nbsp; 💬 <a href="${wa}" style="color:#006948;text-decoration:none;">WhatsApp</a>` : ''}
  &nbsp;|&nbsp; ✉️ <a href="mailto:${escapeHtml(pc.email)}" style="color:#006948;text-decoration:none;">${escapeHtml(pc.email)}</a><br>
  🌐 <a href="${escapeHtml(pc.siteUrl)}" style="color:#006948;text-decoration:none;">${escapeHtml(pc.siteUrl.replace(/^https:\/\//, ''))}</a><br>
  ${escapeHtml(pc.address)}
</td></tr></table></td></tr></table></body></html>`;
}
const row = (label, value) => (value ? `<tr><td style="padding:6px 0;color:#6b7280;width:40%;">${escapeHtml(label)}</td><td style="padding:6px 0;font-weight:bold;">${escapeHtml(value)}</td></tr>` : '');
const detailsTable = (rows) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;margin:18px 0;">${rows.join('')}</table>`;

// ---------- customer emails ----------
async function sendBookingConfirmation(booking, { force = false } = {}) {
  const s = await getSettings();
  if (!force && !s.customer_booking_confirmation) return { ok: false, disabled: true };
  if (!booking || !booking.customer_email || isTempEmail(booking.customer_email)) return { ok: false, skipped: true };
  const pc = publicConfig();
  const paid = Number(booking.total_amount) > 0 && booking.payment_status === 'completed';
  const body = `
    <p style="margin:0 0 12px;">Dear ${escapeHtml(booking.customer_name || 'Customer')},</p>
    <p style="margin:0 0 12px;">Thank you for choosing ${escapeHtml(pc.name)}! Your appointment is <b style="color:#006948;">confirmed</b>.
    Our team will call you before the visit.</p>
    ${detailsTable([
      row('Booking ID', booking.booking_id),
      row('Service', booking.service_name),
      row('Date', fmtDate(booking.appointment_date)),
      row('Time', fmtTime(booking.appointment_time)),
      row('Phone', booking.customer_phone),
      paid ? row('Amount paid', `₹${Number(booking.total_amount).toLocaleString('en-IN')}`) : row('Charges', 'Free consultation'),
    ])}
    <p style="margin:0 0 12px;">Need to change the time? Call or WhatsApp us on <b>${escapeHtml(pc.phone)}</b> and quote your booking ID.</p>
    <p style="margin:0 0 4px;">आपकी बुकिंग कन्फ़र्म हो गई है। बदलाव के लिए ऊपर दिए नंबर पर कॉल या WhatsApp करें।</p>
    <p style="margin:18px 0 0;">Warm regards,<br>Team ${escapeHtml(pc.name)}</p>`;
  return send('booking_confirmation', {
    to: booking.customer_email,
    subject: `Booking Confirmed – ${booking.booking_id} | ${pc.name}`,
    html: layout('Booking confirmed', body, `Your booking ${booking.booking_id} is confirmed`),
    text: `Dear ${booking.customer_name || 'Customer'},\nYour booking ${booking.booking_id} is confirmed.\nService: ${booking.service_name || ''}\nDate: ${fmtDate(booking.appointment_date)} ${fmtTime(booking.appointment_time)}\nQuestions: ${pc.phone}\n${pc.name}`,
  });
}

const STATUS_TEXT = {
  pending: 'is pending review',
  confirmed: 'has been confirmed',
  cancelled: 'has been cancelled',
  completed: 'has been completed',
  rescheduled: 'has been rescheduled',
};
async function sendStatusUpdate(booking, { force = false } = {}) {
  const s = await getSettings();
  if (!force && !s.customer_status_updates) return { ok: false, disabled: true };
  if (!booking || !booking.customer_email || isTempEmail(booking.customer_email)) return { ok: false, skipped: true };
  const pc = publicConfig();
  const st = String(booking.status || '').toLowerCase();
  const body = `
    <p style="margin:0 0 12px;">Dear ${escapeHtml(booking.customer_name || 'Customer')},</p>
    <p style="margin:0 0 12px;">Your booking <b>${escapeHtml(booking.booking_id)}</b> ${escapeHtml(STATUS_TEXT[st] || 'has been updated')}.</p>
    ${detailsTable([
      row('Service', booking.service_name),
      row('Date', fmtDate(booking.appointment_date)),
      row('Time', fmtTime(booking.appointment_time)),
      row('Status', st ? st[0].toUpperCase() + st.slice(1) : ''),
      row('Note from our team', booking.admin_notes),
    ])}
    <p style="margin:0 0 12px;">Questions? Call or WhatsApp us on <b>${escapeHtml(pc.phone)}</b>.</p>
    <p style="margin:18px 0 0;">Warm regards,<br>Team ${escapeHtml(pc.name)}</p>`;
  return send('status_update', {
    to: booking.customer_email,
    subject: `Booking ${booking.booking_id} ${STATUS_TEXT[st] ? STATUS_TEXT[st].replace(/^(is|has been) /, '') : 'updated'} | ${pc.name}`,
    html: layout('Booking update', body),
    text: `Your booking ${booking.booking_id} ${STATUS_TEXT[st] || 'has been updated'}. ${pc.phone}`,
  });
}

const ORDER_STATUS_TEXT = {
  pending: 'has been received and is waiting for our team',
  contacted: 'is being processed — our team has contacted you',
  confirmed: 'has been confirmed',
  dispatched: 'has been dispatched',
  delivered: 'has been delivered',
  completed: 'is complete',
  cancelled: 'has been cancelled',
};
async function sendOrderStatusUpdate(order, { force = false } = {}) {
  const s = await getSettings();
  if (!force && !s.customer_status_updates) return { ok: false, disabled: true };
  if (!order || !order.email || !EMAIL_RE.test(String(order.email).trim()) || isTempEmail(order.email)) return { ok: false, skipped: true };
  const pc = publicConfig();
  const st = String(order.status || '').toLowerCase();
  let items = order.items;
  if (typeof items === 'string') { try { items = JSON.parse(items); } catch (e) { items = []; } }
  const itemText = Array.isArray(items) ? items.map(i => `${i.qty || i.quantity || 1} × ${[i.brand, i.model].filter(Boolean).join(' ')}`).join(', ') : '';
  const body = `
    <p style="margin:0 0 12px;">Dear ${escapeHtml(order.name || 'Customer')},</p>
    <p style="margin:0 0 12px;">Your order <b>#${escapeHtml(order.id)}</b> ${escapeHtml(ORDER_STATUS_TEXT[st] || 'has been updated')}.</p>
    ${detailsTable([row('Items', itemText), row('Status', st ? st[0].toUpperCase() + st.slice(1) : '')])}
    <p style="margin:0 0 12px;">Questions? Call or WhatsApp us on <b>${escapeHtml(pc.phone)}</b>.</p>
    <p style="margin:18px 0 0;">Warm regards,<br>Team ${escapeHtml(pc.name)}</p>`;
  return send('order_status', { to: String(order.email).trim(), subject: `Your order #${order.id} ${st || 'update'} | ${pc.name}`, html: layout('Order update', body), text: `Your order #${order.id} ${ORDER_STATUS_TEXT[st] || 'has been updated'}. ${pc.phone}` });
}

async function sendCustomEmail(to, subject, message, customerName = 'Customer') {
  const pc = publicConfig();
  const body = `<p style="margin:0 0 12px;">Dear ${escapeHtml(customerName)},</p>
    <div style="white-space:pre-wrap;">${escapeHtml(message)}</div>
    <p style="margin:18px 0 0;">Best regards,<br>Team ${escapeHtml(pc.name)}</p>`;
  const r = await send('custom', { to, subject: `${subject} | ${pc.name}`, html: layout(subject, body), text: `${message}\n\n${pc.name}` }, { throwOnError: true });
  return r;
}

// ---------- admin notifications ----------
async function notifyAdmin(kind, toggle, subject, rows, extraHtml = '') {
  const s = await getSettings();
  if (!s[toggle] || !s.admin_notify_email) return { ok: false, disabled: true };
  const body = `<p style="margin:0 0 8px;font-size:17px;font-weight:bold;">${escapeHtml(subject)}</p>${detailsTable(rows)}${extraHtml}
    <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">Open the admin panel to follow up. You get this email because "${escapeHtml(toggle.replace(/_/g, ' '))}" is switched on in Admin → Email &amp; Integrations.</p>`;
  return send(kind, { to: s.admin_notify_email, subject: `[Sologix] ${subject}`, html: layout(subject, body), text: subject });
}
function notifyAdminNewBooking(b) {
  return notifyAdmin('admin_new_booking', 'admin_new_booking', `New booking ${b.booking_id || ''}`.trim(), [
    row('Customer', b.customer_name), row('Phone', b.customer_phone),
    row('Email', isTempEmail(b.customer_email) ? '' : b.customer_email), row('Service', b.service_name),
    row('Date', b.appointment_date ? fmtDate(b.appointment_date) : ''), row('Time', b.appointment_time ? fmtTime(b.appointment_time) : ''),
    row('Notes', b.notes),
  ]);
}
function notifyAdminNewLead(l) {
  return notifyAdmin('admin_new_lead', 'admin_new_lead', `New enquiry from ${l.name || 'website'}`, [
    row('Name', l.name), row('Phone', l.phone), row('Email', l.email), row('Interested in', l.service_interest),
    row('Source', l.source), row('Message', l.message),
  ]);
}
function notifyAdminNewOrder(o) {
  const items = Array.isArray(o.items) ? o.items.map(i => `${i.qty || i.quantity || 1} × ${[i.brand, i.model].filter(Boolean).join(' ')}`).join(', ') : '';
  return notifyAdmin('admin_new_order', 'admin_new_order', `New product order from ${o.name || 'customer'}`, [
    row('Name', o.name), row('Phone', o.phone), row('Email', o.email), row('Items', items),
    row('Amount', o.amount ? `₹${Number(o.amount).toLocaleString('en-IN')}` : ''), row('Payment', o.payment_method || o.status),
    row('Address', o.address),
  ]);
}
// Fire-and-forget wrapper so a slow mail server never delays a customer's request.
function later(fn, ...args) {
  setImmediate(() => { Promise.resolve().then(() => fn(...args)).catch(err => console.error('Email task failed:', err.message)); });
}

// ---------- admin page helpers ----------
async function sendTestEmail(to) {
  const pc = publicConfig();
  const e = smtpEnv();
  const body = `<p style="margin:0 0 12px;">This is a test email from your website's admin panel.</p>
    <p style="margin:0 0 12px;">If you can read this, email sending works. Customers will receive booking confirmations from <b>${escapeHtml(e.from)}</b>.</p>
    ${detailsTable([row('SMTP server', `${e.host}:${e.port}`), row('Sent at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST')])}`;
  return send('test', { to, subject: `Test email | ${pc.name}`, html: layout('Test email', body), text: 'Test email from the Sologix admin panel. Email sending works.' }, { throwOnError: true });
}
async function verifyConnection() {
  const t = getTransporter();
  if (!t) return { ok: false, error: 'Email is not set up in .env' };
  try { await t.verify(); return { ok: true }; }
  catch (err) { return { ok: false, error: String(err && (err.response || err.message) || err).slice(0, 300) }; }
}
function status() {
  const e = smtpEnv();
  return {
    configured: smtpConfigured(),
    host: e.host,
    port: e.port,
    security: e.secure ? 'SSL/TLS' : 'STARTTLS',
    user: e.user ? mask(e.user) : '',
    from: e.from ? mask(e.from) : '',
    last_error: lastError,
    recent,
  };
}

module.exports = {
  sendBookingConfirmation, sendStatusUpdate, sendCustomEmail, sendOrderStatusUpdate,
  notifyAdminNewBooking, notifyAdminNewLead, notifyAdminNewOrder, later,
  getSettings, saveSettings, sendTestEmail, verifyConnection, status,
  // exported for tests
  _singleRecipient: singleRecipient, _escapeHtml: escapeHtml, _layout: layout,
};
