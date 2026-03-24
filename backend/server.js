const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
require('dotenv').config();

const brand = require('../brand.config');
const app   = express();

// Security headers
app.use(helmet({ contentSecurityPolicy: false }));
app.disable('x-powered-by');

const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.APP_URL || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      }));
      app.use(express.json());
      app.use(express.static('public'));

      // ── API routes ─────────────────────────────────────────────────────────────────
      app.use('/api/customers',  require('./routes/customers'));
      app.use('/api/jobs',       require('./routes/jobs'));
      app.use('/api/users',      require('./routes/users'));
      app.use('/api/quotes',     require('./routes/quotes'));
      app.use('/api/invoices',   require('./routes/invoices'));
      app.use('/api/auth',       require('./routes/auth').router);
      app.use('/api/quickbooks', require('./routes/quickbooks'));
      app.use('/api/sms',        require('./routes/sms'));
      app.use('/api/backup',     require('./routes/backup'));
      app.use('/api/pricebook',  require('./routes/pricebook'));
      app.use('/api/exports',    require('./routes/exports'));
      app.use('/api/invites',    require('./routes/invites'));
      // Google OAuth callback — mount invites router at /api/auth so
      // GOOGLE_CALLBACK_URL=/api/auth/google/callback works
      app.use('/api/auth',       require('./routes/invites'));

      // ── Brand config endpoint (read-only, safe for front-end consumption) ──────────
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

                                      // ── Health check ───────────────────────────────────────────────────────────────
                                      app.get('/api/health', (_req, res) => {
                                        res.json({
                                            message:   `${brand.companyName} Platform is running!`,
                                                tradeType: brand.tradeType,
                                                    version:   '1.0.0',
                                                        timestamp: new Date().toISOString(),
                                                          });
                                                          });

                                                          // ── Nightly backup cron (03:00) ────────────────────────────────────────────────
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

                                                                              app.listen(PORT, () => {
                                                                                console.log(`[${brand.companyName}] Server running on port ${PORT} | trade=${brand.tradeType}`);
                                                                                });

                                                                                // ── Global error handler ───────────────────────────────────────────────────────
                                                                                app.use((err, _req, res, _next) => {
                                                                                  console.error('[ERROR]', err.message);
                                                                                    res.status(err.status || 500).json({
                                                                                        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
                                                                                          });
                                                                                          });
                                                                                          
