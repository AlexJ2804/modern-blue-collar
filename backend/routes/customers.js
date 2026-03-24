/**
 * routes/customers.js
 * Customer CRUD. Default state is driven by brand.config.js (BRAND_DEFAULT_STATE).
 * Includes optimistic locking on PATCH (version field).
 */

const express           = require('express');
const router            = express.Router();
const { PrismaClient }  = require('@prisma/client');
const { requireAuth }   = require('./auth');
const { optimisticUpdate } = require('../helpers/optimisticUpdate');
const brand             = require('../../brand.config');

const prisma = new PrismaClient();

// GET /api/customers
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { search, type } = req.query;
    const where = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName:  { contains: search } },
        { phone:     { contains: search } },
        { email:     { contains: search } },
      ];
    }
    const customers = await prisma.customer.findMany({
      where,
      include: { _count: { select: { jobs: true } } },
      orderBy: { lastName: 'asc' },
    });
    res.json(customers);
  } catch (err) { next(err); }
});

// GET /api/customers/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        jobs: { orderBy: { createdAt: 'desc' }, include: { quote: true, invoice: true, technician: { select: { id: true, firstName: true, lastName: true } } } },
        communications: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) { next(err); }
});

// POST /api/customers
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, address, city, state, zip, type, notes } = req.body;
    if (!firstName || !lastName || !phone)
      return res.status(400).json({ error: 'firstName, lastName and phone are required' });

    const customer = await prisma.customer.create({
      data: {
        firstName, lastName, email, phone, address, city,
        state: state || brand.defaultState,
        zip, type: type || 'residential', notes,
      },
    });
    res.status(201).json(customer);
  } catch (err) { next(err); }
});

// PATCH /api/customers/:id — with optimistic locking
router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const customer = await optimisticUpdate('customer', Number(req.params.id), req.body);
    res.json(customer);
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

// PUT /api/customers/:id — alias for PATCH with optimistic locking
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const customer = await optimisticUpdate('customer', Number(req.params.id), req.body);
    res.json(customer);
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

// DELETE /api/customers/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.customer.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
