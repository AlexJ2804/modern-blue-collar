/**
 * backup.js
  * Utility to create a timestamped copy of the SQLite database.
   * Called automatically by node-cron at 03:00 (brand.timezone)
    * and manually via POST /api/backup/run.
     *
      * Files are saved to backend/backups/backup_YYYY-MM-DD_HHMMSS.db
       * Keeps the 30 most recent backups (deletes older ones).
        */

        const fs   = require('fs');
        const path = require('path');

        const BACKUP_DIR   = path.join(__dirname, 'backups');
        const DB_PATH      = path.join(__dirname, 'prisma', 'dev.db');
        const MAX_BACKUPS  = 30;

        async function runBackup() {
          // Determine DB path from env (supports prod.db)
            const dbPath = process.env.DATABASE_URL
                ? process.env.DATABASE_URL.replace('file:', '').replace('./', path.join(__dirname, 'prisma/'))
                    : DB_PATH;

                      if (!fs.existsSync(dbPath)) {
                          throw new Error(`Database file not found: ${dbPath}`);
                            }

                              // Ensure backup dir exists
                                if (!fs.existsSync(BACKUP_DIR)) {
                                    fs.mkdirSync(BACKUP_DIR, { recursive: true });
                                      }

                                        // Create timestamped backup
                                          const now      = new Date();
                                            const stamp    = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
                                              const destPath = path.join(BACKUP_DIR, `backup_${stamp}.db`);

                                                fs.copyFileSync(dbPath, destPath);
                                                  console.log(`[BACKUP] Saved: ${destPath}`);

                                                    // Prune old backups — keep MAX_BACKUPS most recent
                                                      const files = fs.readdirSync(BACKUP_DIR)
                                                          .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
                                                              .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
                                                                  .sort((a, b) => b.mtime - a.mtime);

                                                                    const toDelete = files.slice(MAX_BACKUPS);
                                                                      for (const { name } of toDelete) {
                                                                          fs.unlinkSync(path.join(BACKUP_DIR, name));
                                                                              console.log(`[BACKUP] Pruned old backup: ${name}`);
                                                                                }

                                                                                  return destPath;
                                                                                  }

                                                                                  module.exports = { runBackup };
                                                                                  
