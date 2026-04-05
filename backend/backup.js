/**
 * backup.js
 * Utility to create a timestamped copy of the SQLite database.
 * Called automatically by node-cron at 03:00 (brand.timezone)
 * and manually via POST /api/backup/run.
 *
 * 1. Local backup  → backend/backups/backup_YYYY-MM-DD_HHMMSS.db
 * 2. Wasabi upload  → s3://BUCKET/backups/backup_YYYY-MM-DD_HHMMSS.db
 *    (only if WASABI_BUCKET is configured)
 *
 * Keeps the 30 most recent local backups (deletes older ones).
 * Wasabi retention is managed by Wasabi's built-in lifecycle policies.
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
  const filename = `backup_${stamp}.db`;
  const destPath = path.join(BACKUP_DIR, filename);

  fs.copyFileSync(dbPath, destPath);
  console.log(`[BACKUP] Local saved: ${destPath}`);

  // Upload to Wasabi if configured
  const wasabiResult = await uploadToWasabi(destPath, filename);

  // Prune old local backups — keep MAX_BACKUPS most recent
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
    .sort((a, b) => b.mtime - a.mtime);

  const toDelete = files.slice(MAX_BACKUPS);
  for (const { name } of toDelete) {
    fs.unlinkSync(path.join(BACKUP_DIR, name));
    console.log(`[BACKUP] Pruned old local backup: ${name}`);
  }

  return { localPath: destPath, wasabi: wasabiResult };
}

/**
 * Upload backup file to Wasabi (S3-compatible).
 * Wasabi uses the same S3 API — just with a different endpoint.
 *
 * Required env vars:
 *   WASABI_BUCKET       — bucket name (e.g. "allpro-backups")
 *   WASABI_ACCESS_KEY   — Wasabi access key
 *   WASABI_SECRET_KEY   — Wasabi secret key
 *   WASABI_REGION       — Wasabi region (default: us-east-1)
 *   WASABI_ENDPOINT     — Wasabi endpoint (default: https://s3.wasabisys.com)
 *
 * @returns {object|null} Upload result or null if not configured
 */
async function uploadToWasabi(filePath, filename) {
  const bucket    = process.env.WASABI_BUCKET;
  const accessKey = process.env.WASABI_ACCESS_KEY;
  const secretKey = process.env.WASABI_SECRET_KEY;

  if (!bucket || !accessKey || !secretKey) {
    console.log('[BACKUP] Wasabi not configured — skipping cloud upload.');
    console.log('[BACKUP] Set WASABI_BUCKET, WASABI_ACCESS_KEY, WASABI_SECRET_KEY to enable.');
    return null;
  }

  try {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

    const region   = process.env.WASABI_REGION   || 'us-east-1';
    const endpoint = process.env.WASABI_ENDPOINT || `https://s3.${region}.wasabisys.com`;

    const client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId:     accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true,
    });

    const fileStream = fs.createReadStream(filePath);
    const key = `backups/${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key:    key,
      Body:   fileStream,
      ContentType: 'application/octet-stream',
    });

    await client.send(command);
    console.log(`[BACKUP] Wasabi uploaded: s3://${bucket}/${key}`);
    return { bucket, key, endpoint };
  } catch (err) {
    console.error(`[BACKUP] Wasabi upload failed: ${err.message}`);
    // Don't throw — local backup still succeeded
    return { error: err.message };
  }
}

module.exports = { runBackup };
