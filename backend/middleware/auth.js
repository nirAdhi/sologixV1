const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_do_not_use_in_production';

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: Using fallback JWT_SECRET. Set JWT_SECRET in production!');
}

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    // Basic token format check - prevent malformed token attacks
    if (!token || token.split('.').length !== 3) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token, access denied' 
      });
    }

    // Pin to HS256 algorithm - prevent algorithm confusion attacks (e.g. alg:none)
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    
    // Block customer tokens from accessing admin routes
    if (decoded.type === 'customer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: customer tokens cannot access admin routes' 
      });
    }
    
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token is invalid or expired' 
    });
  }
};

module.exports = auth;
