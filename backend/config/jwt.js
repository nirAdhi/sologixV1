// Central JWT configuration. The secret is validated in middleware/auth.js, which
// refuses to start without a strong JWT_SECRET (no insecure fallback anywhere).
const { JWT_SECRET } = require('../middleware/auth');
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';

module.exports = { JWT_SECRET, JWT_EXPIRE };
