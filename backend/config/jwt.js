// Central JWT configuration — single source of truth
// Generate a strong secret: openssl rand -hex 32
const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_do_not_use_in_production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';

if (!process.env.JWT_SECRET) {
  console.warn('[SECURITY] WARNING: Using fallback JWT_SECRET. Set a strong 256-bit secret in production!');
}

module.exports = { JWT_SECRET, JWT_EXPIRE };
