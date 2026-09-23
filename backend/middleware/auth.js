const jwt = require('jsonwebtoken');
const db = require('../config/database');

// SECURITY: refuse to run with a missing or weak secret. Previously this fell
// back to a hard-coded string that is public in the source, which would let
// anyone mint admin tokens.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32 || /^(change[_-]?me|sologix_|dev_fallback|your[_-])/i.test(JWT_SECRET)) {
  throw new Error(
    'JWT_SECRET must be a random value of at least 32 characters (not a placeholder or the old default). ' +
    'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
}

/**
 * Admin authentication.
 *
 * Fixes vs. the previous version:
 *  - Rejects customer tokens. Customer and admin tokens are signed with the
 *    same secret, and the old middleware accepted ANY valid token, so a
 *    self-registered customer could call every admin endpoint.
 *  - Re-validates the admin against the database on every request so that
 *    deactivated/deleted admins and role changes take effect immediately
 *    instead of when the token happens to expire.
 */
const auth = async (req, res, next) => {
  try {
    const header = req.header('Authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    // Basic format check (kept from the live build)
    if (!token || token.split('.').length !== 3) {
      return res.status(401).json({ success: false, message: 'No authentication token, access denied' });
    }

    // Pin the algorithm (kept from the live build) to prevent alg-confusion tokens.
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    // Only tokens explicitly issued to admins are accepted here.
    if (decoded.type !== 'admin' || !decoded.id) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const [rows] = await db.query(
      'SELECT id, email, name, role, permissions, is_active FROM admins WHERE id = ? LIMIT 1',
      [decoded.id]
    );
    const admin = rows[0];
    if (!admin || !admin.is_active) {
      return res.status(401).json({ success: false, message: 'Account is inactive or no longer exists' });
    }

    let permissions = {};
    try { permissions = typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : (admin.permissions || {}); } catch (_) { /* ignore */ }

    // Trust the database row, not the token body, for identity and role.
    req.admin = { id: admin.id, email: admin.email, name: admin.name, role: admin.role, permissions };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
  }
};

/** Only super admins. */
const requireSuperAdmin = (req, res, next) => {
  if (req.admin?.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Super admin only.' });
  }
  next();
};

/**
 * Require a named permission (e.g. 'manage_bookings'). Super admins always pass.
 * The permissions JSON already stored on each admin row was previously never
 * checked anywhere; this makes it meaningful.
 */
const requirePermission = (permission) => (req, res, next) => {
  if (req.admin?.role === 'super_admin' || req.admin?.permissions?.[permission] === true) {
    return next();
  }
  return res.status(403).json({ success: false, message: `Access denied. Missing permission: ${permission}` });
};

module.exports = auth;
module.exports.auth = auth;
module.exports.requireSuperAdmin = requireSuperAdmin;
module.exports.requirePermission = requirePermission;
module.exports.JWT_SECRET = JWT_SECRET;
