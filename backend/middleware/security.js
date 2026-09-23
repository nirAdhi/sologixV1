const { body, param, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// ── Input length helper ──
// Previously this also regex-stripped "HTML" and words like "on...=", which
// silently mangled legitimate text (e.g. "condition = good" -> "c good") while
// not being a real XSS defence. Output is escaped where it is rendered (React,
// email templates), so input is only trimmed and length-limited here.
const sanitizeStr = (str, maxLen = 500) => {
  if (str === undefined || str === null) return str;
  return String(str).trim().slice(0, maxLen);
};

// Keep the address exactly as typed apart from lower-casing the domain part
// (validator's defaults remove dots and +tags from Gmail addresses).
const EMAIL_OPTS = { gmail_remove_dots: false, gmail_remove_subaddress: false, outlookdotcom_remove_subaddress: false, yahoo_remove_subaddress: false, icloud_remove_subaddress: false };

// ── Validation result handler ──
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

// ── Lead / contact form validators ──
const leadValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('phone').trim().notEmpty().withMessage('Phone is required').matches(/^[\d\s\+\-\(\)]{7,20}$/).withMessage('Invalid phone number'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email').normalizeEmail(EMAIL_OPTS),
  body('message').optional().trim().isLength({ max: 2000 }).withMessage('Message too long'),
  body('address').optional().trim().isLength({ max: 500 }),
  body('service_interest').optional().trim().isLength({ max: 100 }).withMessage('Service interest too long'),
  body('source').optional().trim().isIn(['website','contact_us','partner','booking_request','consultation','calculator','product_quote','manual','referral','whatsapp']).withMessage('Invalid source'),
  body('priority').optional().isIn(['high','medium','low']).withMessage('Invalid priority'),
  validate,
];

// ── Product order validators ──
const orderValidators = [
  body('name').trim().notEmpty().withMessage('Name required').isLength({ max: 100 }),
  body('phone').trim().notEmpty().withMessage('Phone required').matches(/^[\d\s\+\-\(\)]{7,20}$/).withMessage('Invalid phone'),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(EMAIL_OPTS),
  body('address').trim().notEmpty().withMessage('Address required').isLength({ max: 1000 }),
  body('items').isArray({ min: 1, max: 50 }).withMessage('Items must be a non-empty array'),
  body('items.*.id').isInt({ min: 1 }).withMessage('Invalid product'),
  body('items.*.qty').isInt({ min: 1, max: 10000 }).withMessage('Invalid quantity'),
  validate,
];

// ── Strict rate limiter for public form submissions ──
const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,   // 10 minutes
  max: 10,                      // max 10 form submissions per IP per 10 min
  message: { success: false, message: 'Too many submissions, please try again in 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── ID param validator (prevent non-numeric injection) ──
const validateId = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
  validate,
];

module.exports = { sanitizeStr, validate, leadValidators, orderValidators, formLimiter, validateId };
