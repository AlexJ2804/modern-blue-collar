/**
 * routes/users.js
 * Team / user management. Role label uses brand.config.js technicianLabel.
 *
 * Roles: super-admin | admin | technician | dispatcher | office
 */

const express          = require('express');
const router           = express.Router();
const bcrypt           = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('./auth');
const brand            = require('../../brand.config');

const prisma = new PrismaClient();

// GET /api/users  — admin+
router.get('/', requireAuth, requireRole('super-admin', 'admin'), async (_req, res, next) => {
    try {
          const users = await prisma.user.findMany({
                  select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, active: true, status: true, isGhost: true, createdAt: true },
                  orderBy: { lastName: 'asc' },
          });
          res.json(users);
    } catch (err) { next(err); }
});

// GET /api/users/technicians — returns active technicians for job assignment dropdown
router.get('/technicians', requireAuth, async (_req, res, next) => {
    try {
          const techs = await prisma.user.findMany({
                  where:  { active: true, role: { in: ['technician', 'admin', 'super-admin'] } },
                  select: { id: true, firstName: true, lastName: true, phone: true, role: true },
                  orderBy: { firstName: 'asc' },
          });
          // Surface the trade-specific label so the UI can say "Electricians" vs "Plumbers" etc.
      res.json({ technicianLabel: brand.technicianLabel, technicians: techs });
    } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', requireAuth, async (req, res, next) => {
    try {
          const user = await prisma.user.findUnique({
                  where:  { id: Number(req.params.id) },
                  select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, active: true },
          });
          if (!user) return res.status(404).json({ error: 'User not found' });
          res.json(user);
    } catch (err) { next(err); }
});

// POST /api/users — admin+
router.post('/', requireAuth, requireRole('super-admin', 'admin'), async (req, res, next) => {
    try {
          const { email, password, firstName, lastName, role, phone } = req.body;
          if (!email || !password || !firstName || !lastName)
                  return res.status(400).json({ error: 'email, password, firstName, lastName are required' });

      const hashed = await bcrypt.hash(password, 12);
          const user   = await prisma.user.create({
                  data:   { email: email.toLowerCase().trim(), password: hashed, firstName, lastName, role: role || 'technician', phone },
                  select: { id: true, email: true, role: true, firstName: true, lastName: true },
          });
          res.status(201).json(user);
    } catch (err) { next(err); }
});

// PATCH /api/users/:id/approve — admin+ approves a pending auto-provisioned account
router.patch('/:id/approve', requireAuth, requireRole('super-admin', 'admin'), async (req, res, next) => {
    try {
          const user = await prisma.user.update({
                  where:  { id: Number(req.params.id) },
                  data:   { status: 'active' },
                  select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, active: true, status: true },
          });
          res.json(user);
    } catch (err) { next(err); }
});

// Fields a user record may be updated with via PATCH. Anything else in the body
// (password, isGhost, createdAt, id, …) is ignored. `role` is handled separately
// because changing it is restricted to super-admins.
const UPDATABLE_FIELDS = ['firstName', 'lastName', 'phone', 'email', 'active', 'status'];

// PATCH /api/users/:id — admin+ only. Role changes are super-admin-only.
router.patch('/:id', requireAuth, requireRole('super-admin', 'admin'), async (req, res, next) => {
    try {
          const data = {};
          for (const f of UPDATABLE_FIELDS) {
                  if (f in req.body) data[f] = req.body[f];
          }
          if (data.email) data.email = String(data.email).toLowerCase().trim();

          // Role escalation guard: only super-admins may change a user's role.
          if ('role' in req.body) {
                  if (req.user.role !== 'super-admin') {
                          return res.status(403).json({ error: 'Only super-admins can change roles' });
                  }
                  data.role = req.body.role;
          }

          const user = await prisma.user.update({
                  where:  { id: Number(req.params.id) },
                  data,
                  select: { id: true, email: true, role: true, firstName: true, lastName: true, phone: true, active: true, status: true },
          });
          res.json(user);
    } catch (err) { next(err); }
});

// DELETE /api/users/:id — super-admin only (soft-delete by setting active=false is preferred)
router.delete('/:id', requireAuth, requireRole('super-admin'), async (req, res, next) => {
    try {
          await prisma.user.delete({ where: { id: Number(req.params.id) } });
          res.json({ success: true });
    } catch (err) { next(err); }
});

module.exports = router;
