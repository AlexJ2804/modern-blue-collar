/**
 * backup.js
 * Database backup utility — supports PostgreSQL (managed DB) and SQLite (local dev).
 * Called automatically by node-cron at 03:00 (brand.timezone)
 * and manually via POST /api/backup/run.
 *
 * PostgreSQL (production):
 *   Uses pg_dump to create a SQL dump, then uploads to Wasabi.
 *   Requires pg_dump to be available in PATH (included in most Docker/server setups).
 *
 * SQLite (local dev):
 *   Copies the .db file to backend/backups/.
 *
 * Wasabi upload runs after local backup if WASABI_BUCKET is configured.
 * Keeps the 30 most recent local backups (deletes older ones).
 */

const fs    = require('fs');
const path  = require('path');
const { execSync } = require('child_process');

const BACKUP_DIR  = path.join(__dirname, 'backups');
const MAX_BACKUPS = 30;

async function runBackup() {
  const dbUrl = process.env.DATABASE_URL || '';
  const isPostgres = dbUrl.startsWith('postgres');

  // Ensure backup dir exists
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const now   = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

  let destPath;

  if (isPostgres) {
    destPath = await backupPostgres(stamp, dbUrl);
  } else {
    destPath = backupSqlite(stamp, dbUrl);
  }

  // Upload to Wasabi if configured
  const wasabiResult = await uploadToWasabi(destPath, path.basename(destPath));

  // Prune old local backups
  pruneOldBackups();

  return { localPath: destPath, wasabi: wasabiResult };
}

/**
 * PostgreSQL backup via pg_dump
 */
async function backupPostgres(stamp, dbUrl) {
  const filename = `backup_${stamp}.sql`;
  const destPath = path.join(BACKUP_DIR, filename);

  try {
    // pg_dump uses the DATABASE_URL directly
    execSync(`pg_dump "${dbUrl}" --no-owner --no-acl > "${destPath}"`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000, // 2 min timeout
    });
    console.log(`[BACKUP] PostgreSQL dump saved: ${destPath}`);

    // Compress with gzip if available
    try {
      execSync(`gzip -f "${destPath}"`, { stdio: 'pipe', timeout: 60000 });
      const gzPath = destPath + '.gz';
      console.log(`[BACKUP] Compressed: ${gzPath}`);
      return gzPath;
    } catch {
      // gzip not available, use uncompressed
      return destPath;
    }
  } catch (err) {
    // If pg_dump isn't available, fall back to Wasabi-only approach
    console.warn(`[BACKUP] pg_dump failed: ${err.message}`);
    console.warn('[BACKUP] If deploying to Digital Ocean, pg_dump may not be in PATH.');
    console.warn('[BACKUP] Use Digital Ocean managed database built-in backups as primary.');

    // Create a marker file so the API still returns a result
    const markerPath = path.join(BACKUP_DIR, `backup_${stamp}_pgdump_unavailable.txt`);
    fs.writeFileSync(markerPath, `pg_dump not available at ${now.toISOString()}\nUse managed database backups from your hosting provider.\n`);
    return markerPath;
  }
}

/**
 * SQLite backup via file copy (local development)
 */
function backupSqlite(stamp, dbUrl) {
  const DB_PATH = path.join(__dirname, 'prisma', 'dev.db');
  const dbPath = dbUrl
    ? dbUrl.replace('file:', '').replace('./', path.join(__dirname, 'prisma/'))
    : DB_PATH;

  if (!fs.existsSync(dbPath)) {
    throw new Error(`SQLite database file not found: ${dbPath}`);
  }

  const filename = `backup_${stamp}.db`;
  const destPath = path.join(BACKUP_DIR, filename);
  fs.copyFileSync(dbPath, destPath);
  console.log(`[BACKUP] SQLite saved: ${destPath}`);
  return destPath;
}

/**
 * Upload backup file to Wasabi (S3-compatible cloud storage).
 */
async function uploadToWasabi(filePath, filename) {
  const bucket    = process.env.WASABI_BUCKET;
  const accessKey = process.env.WASABI_ACCESS_KEY;
  const secretKey = process.env.WASABI_SECRET_KEY;

  if (!bucket || !accessKey || !secretKey) {
    console.log('[BACKUP] Wasabi not configured — skipping cloud upload.');
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
    return { error: err.message };
  }
}

/**
 * Remove old backups, keep only MAX_BACKUPS most recent.
 */
function pruneOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup_'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);

    const toDelete = files.slice(MAX_BACKUPS);
    for (const { name } of toDelete) {
      fs.unlinkSync(path.join(BACKUP_DIR, name));
      console.log(`[BACKUP] Pruned: ${name}`);
    }
  } catch (err) {
    console.warn(`[BACKUP] Prune error: ${err.message}`);
  }
}

module.exports = { runBackup };
