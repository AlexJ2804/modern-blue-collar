/**
 * routes/auth.js
 * JWT-based authentication.
 * No client-specific data — all company strings come from brand.config.js.
 *
 * Endpoints:
 *   POST /api/auth/login    — email + password → JWT
 *   GET  /api/auth/me       — return current user from JWT
 *   POST /api/auth/logout   — (stateless — client discards token)
 */

const express        = require('express');
const router         = express.Router();
const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { writeAudit } = require('../helpers/audit');

const prisma = new PrismaClient();

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

if (!JWT_SECRET) {
    console.warn('[AUTH] WARNING: JWT_SECRET is not set. Set it in .env before production!');
}

// ── Middleware ─────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
    // If API key middleware already authenticated, skip JWT check
    if (req.user && req.apiKey) return next();

    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Unauthorised — no token or API key' });
    }
    try {
          req.user = jwt.verify(header.slice(7), JWT_SECRET);
          next();
    } catch {
          res.status(401).json({ error: 'Unauthorised — invalid or expired token' });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
          if (!req.user || !roles.includes(req.user.role)) {
                  return res.status(403).json({ error: 'Forbidden — insufficient role' });
          }
          next();
    };
}

// ── Access gate (mounted globally on /api) ───────────────────────────────────
// Two concerns, one pass, so we resolve the actor (from the JWT or an already-set
// API-key user) only once:
//   1. Audit every write performed by a ghost (platform-support) admin.
//   2. Block pending (not-yet-approved) accounts from all data routes.
const WRITE_METHODS  = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
// Paths a pending user may still reach: auth (login/me/logout/google), public
// brand config, and presence. Everything else under /api is denied until approved.
const PENDING_EXEMPT = ['/api/auth', '/api/brand', '/api/presence'];

function resolveActor(req) {
    if (req.user) return req.user; // API-key auth already populated this
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
          try { return jwt.verify(header.slice(7), JWT_SECRET); } catch { return null; }
    }
    return null;
}

function accessGate(req, res, next) {
    const actor = resolveActor(req);

    // Use originalUrl, not req.path: this middleware is mounted at '/api/', so
    // Express strips that prefix from req.path (e.g. '/auth/me'). originalUrl
    // keeps the full path the PENDING_EXEMPT entries are written against.
    const fullPath = req.originalUrl.split('?')[0];

    if (actor && actor.isGhost && WRITE_METHODS.has(req.method)) {
          writeAudit({
                  userId: actor.id,
                  action: `ghost-write ${req.method} ${fullPath}`,
                  ip:     req.ip,
          });
    }

    if (actor && actor.status === 'pending'
        && !PENDING_EXEMPT.some(p => fullPath.startsWith(p))) {
          return res.status(403).json({ error: 'Account pending approval', status: 'pending' });
    }

    next();
}

// Route-level guard equivalent to the pending check above, for explicit use.
function requireApproved(req, res, next) {
    if (req.user && req.user.status === 'pending') {
          return res.status(403).json({ error: 'Account pending approval', status: 'pending' });
    }
    next();
}

// ── POST /api/auth/login ───────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
    try {
          const { email, password } = req.body;
          if (!email || !password)
                  return res.status(400).json({ error: 'email and password are required' });

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
          if (!user || !user.active || user.status === 'deactivated')
                  return res.status(401).json({ error: 'Invalid credentials' });

      const match = await bcrypt.compare(password, user.password);
          if (!match)
                  return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, status: user.status, isGhost: user.isGhost },
              JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
            );

      res.json({
              token,
              user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName, status: user.status, isGhost: user.isGhost },
      });
    } catch (err) { next(err); }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
    try {
          const user = await prisma.user.findUnique({
                  where:  { id: req.user.id },
                  select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, active: true, status: true, isGhost: true },
          });
          if (!user) return res.status(404).json({ error: 'User not found' });
          res.json(user);
    } catch (err) { next(err); }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', (_req, res) => {
    // JWT is stateless — client should discard the token
              res.json({ success: true });
});

module.exports = { router, requireAuth, requireRole, requireApproved, accessGate };
