/**
 * routes/jobs.js
 * CRUD for Jobs. Trade type is derived from brand.config.js.
 * Includes optimistic locking on PATCH (version field).
 *
 * Endpoints:
 *   GET    /api/jobs               — list all jobs (with customer & technician)
 *   GET    /api/jobs/:id           — single job detail
 *   POST   /api/jobs               — create job
 *   PATCH  /api/jobs/:id           — update job (status, assign, reschedule, etc.)
 *   DELETE /api/jobs/:id           — delete job
 *   GET    /api/jobs/types         — returns trade-specific job type list
 */

const express      = require('express');
const router       = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth }  = require('./auth');
const { optimisticUpdate } = require('../helpers/optimisticUpdate');
const brand        = require('../../brand.config');

const prisma = new PrismaClient();

// ── GET /api/jobs/types — trade-specific job types ─────────────────────────────
router.get('/types', requireAuth, (_req, res) => {
    res.json({ tradeType: brand.tradeType, jobTypes: brand.jobTypes });
});

// ── GET /api/jobs ──────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res, next) => {
    try {
          const { status, technicianId, date } = req.query;
          const where = {};
          if (status)      where.status      = status;
          if (technicianId) where.technicianId = Number(technicianId);
          if (date)        where.scheduledDate = date;

      const jobs = await prisma.job.findMany({
              where,
              include: {
                        customer:   { select: { id: true, firstName: true, lastName: true, phone: true, address: true, city: true, state: true } },
                        technician: { select: { id: true, firstName: true, lastName: true, phone: true } },
                        quote:      true,
                        invoice:    true,
              },
              orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }, { createdAt: 'desc' }],
      });
          res.json(jobs);
    } catch (err) { next(err); }
});

// ── GET /api/jobs/:id ──────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res, next) => {
    try {
          const job = await prisma.job.findUnique({
                  where: { id: Number(req.params.id) },
                  include: {
                            customer:   true,
                            technician: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
                            quote:      true,
                            invoice:    true,
                            jobParts:   { include: { inventoryItem: true } },
                  },
          });
          if (!job) return res.status(404).json({ error: 'Job not found' });
          res.json(job);
    } catch (err) { next(err); }
});

// ── POST /api/jobs ─────────────────────────────────────────────────────────────
router.post('/', requireAuth, async (req, res, next) => {
    try {
          const {
                  title, description, customerId, technicianId,
                  status, priority, type, scheduledDate, scheduledTime, duration, notes,
          } = req.body;

      if (!title)      return res.status(400).json({ error: 'title is required' });
          if (!customerId) return res.status(400).json({ error: 'customerId is required' });

      const job = await prisma.job.create({
              data: {
                        title,
                        description,
                        customerId:  Number(customerId),
                        technicianId: technicianId ? Number(technicianId) : undefined,
                        status:      status   || 'pending',
                        priority:    priority || 'normal',
                        type:        type     || brand.jobTypes[0],
                        tradeType:   brand.tradeType,
                        scheduledDate,
                        scheduledTime,
                        duration:    duration ? Number(duration) : 1.5,
                        notes,
              },
              include: { customer: true, technician: { select: { id: true, firstName: true, lastName: true } } },
      });
          res.status(201).json(job);
    } catch (err) { next(err); }
});

// ── PATCH /api/jobs/:id — with optimistic locking ────────────────────────────
router.patch('/:id', requireAuth, async (req, res, next) => {
    try {
          const id   = Number(req.params.id);
          const data = { ...req.body };

      // Coerce numeric FK fields
      if (data.customerId)   data.customerId   = Number(data.customerId);
          if (data.technicianId) data.technicianId = Number(data.technicianId);
          if (data.duration)     data.duration     = Number(data.duration);

      // Auto-set completedAt when status transitions to completed
      if (data.status === 'completed' && !data.completedAt) {
              data.completedAt = new Date();
      }

      const job = await optimisticUpdate('job', id, data, {
              include: { customer: true, technician: { select: { id: true, firstName: true, lastName: true } } },
      });
          res.json(job);
    } catch (err) {
      if (err.status === 409) return res.status(409).json({ error: err.message });
      next(err);
    }
});

// ── PUT /api/jobs/:id — alias for PATCH with optimistic locking ──────────────
router.put('/:id', requireAuth, async (req, res, next) => {
    try {
          const id   = Number(req.params.id);
          const data = { ...req.body };

      if (data.customerId)   data.customerId   = Number(data.customerId);
          if (data.technicianId) data.technicianId = Number(data.technicianId);
          if (data.duration)     data.duration     = Number(data.duration);

      if (data.status === 'completed' && !data.completedAt) {
              data.completedAt = new Date();
      }

      const job = await optimisticUpdate('job', id, data, {
              include: { customer: true, technician: { select: { id: true, firstName: true, lastName: true } } },
      });
          res.json(job);
    } catch (err) {
      if (err.status === 409) return res.status(409).json({ error: err.message });
      next(err);
    }
});

// ── DELETE /api/jobs/:id ───────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
          await prisma.job.delete({ where: { id: Number(req.params.id) } });
          res.json({ success: true });
    } catch (err) { next(err); }
});

module.exports = router;
