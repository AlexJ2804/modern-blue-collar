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

const prisma = new PrismaClient();

const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

if (!JWT_SECRET) {
    console.warn('[AUTH] WARNING: JWT_SECRET is not set. Set it in .env before production!');
}

// ── Middleware ─────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Unauthorised — no token' });
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

// ── POST /api/auth/login ───────────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
    try {
          const { email, password } = req.body;
          if (!email || !password)
                  return res.status(400).json({ error: 'email and password are required' });

      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
          if (!user || !user.active)
                  return res.status(401).json({ error: 'Invalid credentials' });

      const match = await bcrypt.compare(password, user.password);
          if (!match)
                  return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
              JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
            );

      res.json({
              token,
              user: { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
      });
    } catch (err) { next(err); }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
    try {
          const user = await prisma.user.findUnique({
                  where:  { id: req.user.id },
                  select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, active: true },
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

module.exports = { router, requireAuth, requireRole };
