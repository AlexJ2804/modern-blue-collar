/**
 * routes/communications.js
 * Customer communication history: calls, emails, texts, notes.
 * Gmail integration endpoint structure.
 */
const express          = require('express');
const router           = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('./auth');
const prisma           = new PrismaClient();

// GET /api/communications?customerId=X — timeline for a customer
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { customerId, type } = req.query;
    const where = {};
    if (customerId) where.customerId = Number(customerId);
    if (type) where.type = type;

    const comms = await prisma.communication.findMany({
      where,
      include: { customer: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // If customerId provided, also fetch quotes and invoices for timeline
    if (customerId) {
      const jobs = await prisma.job.findMany({
        where: { customerId: Number(customerId) },
        include: { quote: true, invoice: true },
      });

      const timeline = [];

      // Add communications
      comms.forEach(c => {
        timeline.push({
          id: `comm-${c.id}`,
          type: c.type,
          direction: c.direction,
          subject: c.subject,
          body: c.body,
          from: c.from,
          to: c.to,
          createdAt: c.createdAt,
          category: 'communication',
        });
      });

      // Add quotes inline
      jobs.forEach(j => {
        if (j.quote) {
          timeline.push({
            id: `quote-${j.quote.id}`,
            type: 'quote',
            subject: `Quote #${j.quote.id} for Job #${j.id}`,
            body: `Amount: $${j.quote.amount.toFixed(2)} — Status: ${j.quote.status}`,
            createdAt: j.quote.createdAt,
            category: 'financial',
            jobId: j.id,
          });
        }
        if (j.invoice) {
          timeline.push({
            id: `invoice-${j.invoice.id}`,
            type: 'invoice',
            subject: `Invoice #${j.invoice.id} for Job #${j.id}`,
            body: `Amount: $${j.invoice.amount.toFixed(2)} — Status: ${j.invoice.status}`,
            createdAt: j.invoice.createdAt,
            category: 'financial',
            jobId: j.id,
          });
        }
      });

      // Sort by date descending
      timeline.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ communications: comms, timeline });
    }

    res.json(comms);
  } catch (err) { next(err); }
});

// GET /api/communications/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const comm = await prisma.communication.findUnique({
      where: { id: Number(req.params.id) },
      include: { customer: true },
    });
    if (!comm) return res.status(404).json({ error: 'Communication not found' });
    res.json(comm);
  } catch (err) { next(err); }
});

// POST /api/communications — log a call, text, email, or note
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { customerId, type, direction, subject, body, from, to } = req.body;
    if (!customerId || !type) {
      return res.status(400).json({ error: 'customerId and type are required' });
    }
    const comm = await prisma.communication.create({
      data: {
        customerId: Number(customerId),
        type,
        direction: direction || 'outbound',
        subject,
        body,
        from,
        to,
      },
    });
    res.status(201).json(comm);
  } catch (err) { next(err); }
});

// DELETE /api/communications/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.communication.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── Gmail Integration Endpoints ─────────────────────────────────────────────

// POST /api/communications/gmail/sync — sync emails for a customer
router.post('/gmail/sync', requireAuth, requireRole('super-admin', 'admin'), async (req, res, next) => {
  try {
    const { customerId, email } = req.body;
    if (!customerId || !email) {
      return res.status(400).json({ error: 'customerId and email are required' });
    }

    // Gmail API integration placeholder
    // In production, this would use Google Gmail API with OAuth2 to:
    // 1. Search for messages to/from the customer email
    // 2. Import them as Communication records with gmailMsgId
    // 3. Deduplicate using gmailMsgId

    res.json({
      message: 'Gmail sync endpoint ready. Configure GOOGLE_CLIENT_ID and enable Gmail API scope to activate.',
      customerId,
      email,
    });
  } catch (err) { next(err); }
});

// POST /api/communications/gmail/webhook — receive Gmail push notifications
router.post('/gmail/webhook', async (req, res, next) => {
  try {
    // Gmail push notification handler placeholder
    // In production: verify webhook, parse notification, fetch new messages
    res.json({ received: true });
  } catch (err) { next(err); }
});

module.exports = router;
