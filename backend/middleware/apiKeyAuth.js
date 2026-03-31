/**
 * middleware/apiKeyAuth.js
 * Authenticates requests using company API keys (X-API-Key header).
 *
 * Keys are generated via the /api/api-keys routes and stored hashed.
 * The first 8 characters of every key serve as a lookup prefix so we
 * only need to bcrypt-compare against one candidate row.
 *
 * Usage in routes:
 *   const { requireAuth } = require('./auth');
 *   // requireAuth already falls through to API key check if no JWT is present
 */

const bcrypt           = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Express middleware — checks X-API-Key header.
 * On success, sets req.user and req.apiKey on the request.
 * On failure, calls next() without setting req.user (so downstream
 * middleware can decide whether to 401).
 */
async function authenticateApiKey(req, _res, next) {
  const key = req.headers['x-api-key'];
  if (!key) return next();

  try {
    // Key format: mbc_<40 hex chars>  → prefix is first 8 chars ("mbc_" + 4 hex)
    const prefix = key.substring(0, 8);
    const record = await prisma.apiKey.findUnique({ where: { prefix } });

    if (!record || !record.active) return next();

    // Check expiry
    if (record.expiresAt && record.expiresAt < new Date()) return next();

    const valid = await bcrypt.compare(key, record.hashedKey);
    if (!valid) return next();

    // Update lastUsedAt (fire-and-forget)
    prisma.apiKey.update({
      where: { id: record.id },
      data:  { lastUsedAt: new Date() },
    }).catch(() => {});

    // Set req.user so downstream requireAuth / requireRole works
    req.user = {
      id:        record.createdById,
      role:      'api-key',
      apiKeyId:  record.id,
      apiKeyName: record.name,
      scopes:    record.scopes.split(',').map(s => s.trim()),
    };
    req.apiKey = record;
    next();
  } catch (err) {
    console.error('[API-KEY] Auth error:', err.message);
    next();
  }
}

/**
 * Scope-checking middleware.
 * Use after requireAuth to ensure the API key has the needed scope.
 *   router.post('/...', requireAuth, requireScope('write'), handler)
 */
function requireScope(...needed) {
  return (req, res, next) => {
    // JWT users pass through — scopes only apply to API keys
    if (!req.apiKey) return next();
    const has = req.user.scopes || [];
    const missing = needed.filter(s => !has.includes(s));
    if (missing.length) {
      return res.status(403).json({
        error: `API key missing required scope(s): ${missing.join(', ')}`,
      });
    }
    next();
  };
}

module.exports = { authenticateApiKey, requireScope };
