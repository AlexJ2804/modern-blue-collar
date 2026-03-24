/**
 * routes/quotes.js  — Quote CRUD
 * status: draft | sent | approved | declined
 */
const express          = require('express');
const router           = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth }  = require('./auth');
const prisma           = new PrismaClient();

router.get('/',     requireAuth, async (req, res, next) => {
  try {
    const quotes = await prisma.quote.findMany({ include: { job: { include: { customer: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(quotes);
  } catch (e) { next(e); }
});

router.get('/:id',  requireAuth, async (req, res, next) => {
  try {
    const q = await prisma.quote.findUnique({ where: { id: Number(req.params.id) }, include: { job: { include: { customer: true } } } });
    if (!q) return res.status(404).json({ error: 'Quote not found' });
    res.json(q);
  } catch (e) { next(e); }
});

router.post('/',    requireAuth, async (req, res, next) => {
  try {
    const { jobId, amount, notes } = req.body;
    if (!jobId || amount == null) return res.status(400).json({ error: 'jobId and amount are required' });
    const q = await prisma.quote.create({ data: { jobId: Number(jobId), amount: Number(amount), notes } });
    res.status(201).json(q);
  } catch (e) { next(e); }
});

router.patch('/:id', requireAuth, async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.amount) data.amount = Number(data.amount);
    const q = await prisma.quote.update({ where: { id: Number(req.params.id) }, data });
    res.json(q);
  } catch (e) { next(e); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.quote.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
