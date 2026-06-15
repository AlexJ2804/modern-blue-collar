/**
 * routes/sms.js  — Twilio SMS notifications
 * Requires (production): TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 *
 * POST /api/sms/send                 { to, body }  — send ad-hoc SMS
 * POST /api/sms/job-confirm/:jobId                 — send job confirmation SMS to customer
 *
 * When DEMO_MODE=true, sending is a no-op: the message is logged to the console
 * and a Twilio-shaped response is returned, so the demo needs no Twilio account.
 */
const express          = require('express');
const router           = express.Router();
const { PrismaClient } = require('@prisma/client');
const { requireAuth }  = require('./auth');
const brand            = require('../../brand.config');

const prisma = new PrismaClient();

function getTwilioClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env');
  }
  return require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

// Sends an SMS — or, in DEMO_MODE, logs it and returns a fake result so no
// Twilio credentials are required. Returns a Twilio-shaped { sid, status }.
async function deliverSms(to, body) {
  if (process.env.DEMO_MODE === 'true') {
    console.log(`[DEMO] SMS suppressed → to=${to} | body="${body}"`);
    return { sid: `demo-${Date.now()}`, status: 'demo-suppressed' };
  }
  const client = getTwilioClient();
  return client.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER, to });
}

// POST /api/sms/send
router.post('/send', requireAuth, async (req, res, next) => {
  try {
    const { to, body } = req.body;
    if (!to || !body) return res.status(400).json({ error: 'to and body are required' });
    const msg = await deliverSms(to, body);
    res.json({ sid: msg.sid, status: msg.status });
  } catch (err) { next(err); }
});

// POST /api/sms/job-confirm/:jobId
router.post('/job-confirm/:jobId', requireAuth, async (req, res, next) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: Number(req.params.jobId) },
      include: { customer: true },
    });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!job.customer.phone) return res.status(400).json({ error: 'Customer has no phone number' });

    const dateStr = job.scheduledDate || 'TBD';
    const timeStr = job.scheduledTime || '';
    const body = `Hi ${job.customer.firstName}, this is ${brand.companyName}. ` +
      `Your ${brand.tradeType} service is confirmed for ${dateStr}${timeStr ? ' at ' + timeStr : ''}. ` +
      `Questions? Call us at ${brand.companyPhone || 'our office'}.`;

    const msg = await deliverSms(job.customer.phone, body);
    res.json({ sid: msg.sid, status: msg.status, sentTo: job.customer.phone });
  } catch (err) { next(err); }
});

module.exports = router;
