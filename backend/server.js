const express = require('express');
const http    = require('http');
const helmet  = require('helmet');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const brand = require('../brand.config');
const app   = express();
const server = http.createServer(app);

// ── Socket.io — real-time presence ──────────────────────────────────────────
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: process.env.APP_URL || '*', methods: ['GET', 'POST'] },
});

// In-memory presence: { jobId: { socketId: { userId, firstName, lastName } } }
const presence = {};

io.on('connection', (socket) => {
  let currentJobId = null;
  let currentUser  = null;

  socket.on('viewing-job', ({ jobId, user }) => {
    // Clean up previous room
    if (currentJobId && presence[currentJobId]) {
      delete presence[currentJobId][socket.id];
      if (Object.keys(presence[currentJobId]).length === 0) delete presence[currentJobId];
      socket.leave(`job:${currentJobId}`);
      io.to(`job:${currentJobId}`).emit('presence-update', { jobId: currentJobId, viewers: presence[currentJobId] || {} });
    }
    currentJobId = String(jobId);
    currentUser  = user;
    if (!presence[currentJobId]) presence[currentJobId] = {};
    presence[currentJobId][socket.id] = { userId: user.id, firstName: user.firstName, lastName: user.lastName };
    socket.join(`job:${currentJobId}`);
    io.to(`job:${currentJobId}`).emit('presence-update', { jobId: currentJobId, viewers: presence[currentJobId] });
  });

  socket.on('leave-job', () => {
    if (currentJobId && presence[currentJobId]) {
      delete presence[currentJobId][socket.id];
      if (Object.keys(presence[currentJobId]).length === 0) delete presence[currentJobId];
      io.to(`job:${currentJobId}`).emit('presence-update', { jobId: currentJobId, viewers: presence[currentJobId] || {} });
      socket.leave(`job:${currentJobId}`);
    }
    currentJobId = null;
    currentUser  = null;
  });

  socket.on('disconnect', () => {
    if (currentJobId && presence[currentJobId]) {
      delete presence[currentJobId][socket.id];
      if (Object.keys(presence[currentJobId]).length === 0) delete presence[currentJobId];
      io.to(`job:${currentJobId}`).emit('presence-update', { jobId: currentJobId, viewers: presence[currentJobId] || {} });
    }
  });
});

// Make io accessible to routes
app.set('io', io);
app.set('presence', presence);

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.disable('x-powered-by');

const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.APP_URL || '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));
app.use(express.json());

// ── API key authentication (runs before routes, sets req.user if valid) ────
const { authenticateApiKey } = require('./middleware/apiKeyAuth');
app.use('/api/', authenticateApiKey);

// ── Rate limiting ───────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

app.use(express.static('public'));

// ── Presence REST endpoint (for initial page load) ──────────────────────────
app.get('/api/presence', (req, res) => {
  res.json(presence);
});

app.get('/api/presence/:jobId', (req, res) => {
  const jobId = String(req.params.jobId);
  res.json({ jobId, viewers: presence[jobId] || {} });
});

// ── API routes ──────────────────────────────────────────────────────────────
app.use('/api/customers',       require('./routes/customers'));
app.use('/api/jobs',            require('./routes/jobs'));
app.use('/api/users',           require('./routes/users'));
app.use('/api/quotes',          require('./routes/quotes'));
app.use('/api/invoices',        require('./routes/invoices'));
app.use('/api/auth',            require('./routes/auth').router);
app.use('/api/quickbooks',      require('./routes/quickbooks'));
app.use('/api/sms',             require('./routes/sms'));
app.use('/api/backup',          require('./routes/backup'));
app.use('/api/pricebook',       require('./routes/pricebook'));
app.use('/api/exports',         require('./routes/exports'));
app.use('/api/invites',         require('./routes/invites'));
app.use('/api/communications',  require('./routes/communications'));
app.use('/api/api-keys',        require('./routes/apiKeys'));
// Google OAuth callback — mount invites router at /api/auth so
// GOOGLE_CALLBACK_URL=/api/auth/google/callback works
app.use('/api/auth',            require('./routes/invites'));

// ── Brand config endpoint (read-only, safe for front-end consumption) ──────
app.get('/api/brand', (_req, res) => {
  res.json({
    companyName:     brand.companyName,
    companySlogan:   brand.companySlogan,
    tradeType:       brand.tradeType,
    technicianLabel: brand.technicianLabel,
    industryLabel:   brand.industryLabel,
    jobTypes:        brand.jobTypes,
    colors:          brand.colors,
  });
});

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    message:   `${brand.companyName} Platform is running!`,
    tradeType: brand.tradeType,
    version:   '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Nightly backup cron (03:00) ─────────────────────────────────────────────
try {
  const cron         = require('node-cron');
  const { runBackup} = require('./backup');
  cron.schedule('0 3 * * *', () => {
    console.log('[CRON] Starting nightly backup at 03:00...');
    runBackup().catch(e => console.error('[CRON] Backup failed:', e.message));
  }, { timezone: brand.timezone });
  console.log(`Nightly backup scheduled at 03:00 (${brand.timezone})`);
} catch (e) {
  console.warn('node-cron not available — nightly backup disabled:', e.message);
}

server.listen(PORT, () => {
  console.log(`[${brand.companyName}] Server running on port ${PORT} | trade=${brand.tradeType}`);
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

module.exports = { app, server };
