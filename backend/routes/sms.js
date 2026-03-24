/**
 * routes/sms.js  — Twilio SMS notifications
  * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
   *
    * POST /api/sms/send   { to, body }  — send ad-hoc SMS
     * POST /api/sms/job-confirm/:jobId   — send job confirmation SMS to customer
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

                  // POST /api/sms/send
                  router.post('/send', requireAuth, async (req, res, next) => {
                    try {
                        const { to, body } = req.body;
                            if (!to || !body) return res.status(400).json({ error: 'to and body are required' });

                                const client = getTwilioClient();
                                    const msg = await client.messages.create({
                                          body,
                                                from: process.env.TWILIO_PHONE_NUMBER,
                                                      to,
                                                          });
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
                                                                                                                      
                                                                                                                          const client = getTwilioClient();
                                                                                                                              const msg = await client.messages.create({
                                                                                                                                    body,
                                                                                                                                          from: process.env.TWILIO_PHONE_NUMBER,
                                                                                                                                                to: job.customer.phone,
                                                                                                                                                    });
                                                                                                                                                        res.json({ sid: msg.sid, status: msg.status, sentTo: job.customer.phone });
                                                                                                                                                          } catch (err) { next(err); }
                                                                                                                                                          });
                                                                                                                                                          
                                                                                                                                                          module.exports = router;
                                                                                                                                                          
