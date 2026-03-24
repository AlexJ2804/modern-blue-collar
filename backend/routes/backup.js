/**
 * routes/backup.js  — Manual backup trigger endpoint
  * POST /api/backup/run  — trigger backup now (admin+)
   * GET  /api/backup/list — list existing backup files (admin+)
    */
    const express         = require('express');
    const router          = express.Router();
    const { requireAuth, requireRole } = require('./auth');

    router.post('/run', requireAuth, requireRole('super-admin', 'admin'), async (_req, res, next) => {
      try {
          const { runBackup } = require('../backup');
              await runBackup();
                  res.json({ success: true, message: 'Backup completed successfully.' });
                    } catch (err) { next(err); }
                    });

                    router.get('/list', requireAuth, requireRole('super-admin', 'admin'), (_req, res, next) => {
                      try {
                          const fs   = require('fs');
                              const path = require('path');
                                  const dir  = path.join(__dirname, '..', 'backups');
                                      if (!fs.existsSync(dir)) return res.json({ backups: [] });
                                          const files = fs.readdirSync(dir)
                                                .filter(f => f.endsWith('.db') || f.endsWith('.zip'))
                                                      .map(f => {
                                                              const stat = fs.statSync(path.join(dir, f));
                                                                      return { filename: f, size: stat.size, created: stat.mtime };
                                                                            })
                                                                                  .sort((a, b) => new Date(b.created) - new Date(a.created));
                                                                                      res.json({ backups: files });
                                                                                        } catch (err) { next(err); }
                                                                                        });

                                                                                        module.exports = router;
                                                                                        
