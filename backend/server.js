require('dotenv').config();
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();

// Gzip all responses — biggest single perf win (cuts JS/CSS/JSON by 60-80%)
app.use(compression({ level: 6, threshold: 1024 }));

// Trust Railway's reverse proxy — required for express-rate-limit to correctly
// read client IPs from X-Forwarded-For headers without throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);

// Security: Validate JWT_SECRET strength at startup
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  WARNING: JWT_SECRET is not set or too short. Set a strong 256-bit secret in production!');
}
if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === '') {
  console.warn('⚠️  WARNING: DB_PASSWORD is empty. Set a strong database password!');
}
if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'Adminpass2') {
  console.warn('⚠️  WARNING: Default ADMIN_PASSWORD detected. Change it before going to production!');
}

// Security: Set security headers
const self = process.env.NODE_ENV === 'production'
  ? 'https://sologixenergy.com'
  : 'http://localhost:3000';

app.use(helmet({
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdn.jsdelivr.net'],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://checkout.razorpay.com', 'https://cdn.razorpay.com', 'https://api.razorpay.com', 'https://cdn.tailwindcss.com', 'https://www.googletagmanager.com', 'https://www.google-analytics.com', 'https://ssl.google-analytics.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'http:', 'https://www.google-analytics.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
      connectSrc: ["'self'", 'https:', 'http:', 'wss:', 'https://www.google-analytics.com', 'https://analytics.google.com', 'https://region1.google-analytics.com'],
      frameSrc: ["'self'", 'https://checkout.razorpay.com', 'https://api.razorpay.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'https:', 'http:']
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration - allow all origins for production
// Also allow all in development and if NODE_ENV not set
const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT_NAME;

// Allowed origins — restrict in production
const productionOrigins = [
  'https://sologixenergy.com',
  'https://www.sologixenergy.com'
];

// Add Railway domain if available
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  productionOrigins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
}

// Add custom allowed origins from env
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(o => productionOrigins.push(o.trim()));
}

app.use(cors({
  origin: function(origin, callback) {
    // Allow server-to-server requests (no origin header)
    if (!origin) return callback(null, true);

    if (isProduction) {
      // In production, only allow known origins
      if (productionOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS: Origin not allowed'), false);
    }

    // Development: allow localhost
    const devOrigins = ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000'];
    if (devOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS: Origin not allowed'), false);
  },
  credentials: true
}));

// Rate limiting to prevent brute force attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per 15 minutes
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/customer/login', authLimiter);
app.use('/api/customer/register', authLimiter);

// Body parsing with size limits
// Skip json parsing for razorpay-webhook to allow express.raw() in the route handler
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/razorpay-webhook') {
    next();
  } else {
    express.json({ limit: '500kb' })(req, res, next);
  }
});
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/razorpay-webhook') {
    next();
  } else {
    express.urlencoded({ extended: true, limit: '500kb' })(req, res, next);
  }
});

// Serve uploaded files from project directory
const uploadDir = path.join(__dirname, 'uploads');
console.log('Upload directory:', uploadDir);
// Serve uploads - prevent path traversal
app.use('/uploads', (req, res, next) => {
  const reqPath = req.path;
  if (reqPath.includes('..') || reqPath.includes('%2e') || reqPath.includes('%2f')) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
}, express.static(uploadDir, { dotfiles: 'deny' }));

// WhatsApp webhook - must be before SPA catch-all
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/upload', require('./routes/upload'));

// API routes FIRST
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Solar Booking API is running' });
});

app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/customer', require('./routes/customer'));
app.use('/api/callback', require('./routes/callback'));
// Public lead submissions get their own strict rate limiter (defined in security middleware)
app.use('/api/leads', require('./routes/leads'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/site-settings', require('./routes/siteSettings'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/product-orders', require('./routes/productOrders'));

// Serve frontend SPA if built (must be AFTER API routes)
const frontendBuildPath = path.resolve(__dirname, '..', 'frontend', 'build');
if (fs.existsSync(frontendBuildPath)) {
  // Service worker & manifest must never be cached so PWA updates propagate instantly
  app.get('/sw.js', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Content-Type', 'application/javascript');
    res.sendFile(path.join(frontendBuildPath, 'sw.js'));
  });
  app.get('/manifest.json', (req, res) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Content-Type', 'application/manifest+json');
    res.sendFile(path.join(frontendBuildPath, 'manifest.json'));
  });

  app.use(express.static(frontendBuildPath, { index: false }));
  
  // Root path - serve React app (index.html)
  app.get('/', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  
  // Admin routes - serve SPA
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  
  // Catch-all for other SPA routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
  console.log('Frontend build detected; serving from frontend/build');
} else {
  console.log('Frontend build not found; API-only mode');
}

app.use((err, req, res, next) => {
  // Never leak stack traces or internal error details in production
  const isDev = process.env.NODE_ENV === 'development';
  console.error('[ERROR]', err.message); // log without stack in prod
  if (isDev) console.error(err.stack);

  // Handle CORS errors specifically
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({ success: false, message: 'Not allowed' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'An error occurred',
  });
});

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

const PORT = process.env.PORT || 5000;

// Try to connect to database, but don't fail if it doesn't exist (for initial deployment)
const db = require('./config/database');

db.getConnection()
  .then(async connection => {
    console.log('Database connected successfully');
    connection.release();
    
    // Initialize database tables
    try {
      await require('./config/initDatabase')();
    } catch (err) {
      console.warn('Database initialization warning:', err.message);
    }
  })
  .catch(err => {
    console.warn('Database connection failed (expected during initial setup):', err.message);
  })
  .finally(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
