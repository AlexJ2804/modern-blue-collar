/**
 * routes/apiKeys.js
 * API key management — create, list, revoke.
 * Only super-admin and admin roles can manage keys.
 *
 * Endpoints:
 *   GET    /api/api-keys       — list all keys (hashed key is never returned)
 *   POST   /api/api-keys       — create a new key (plaintext returned ONCE)
 *   DELETE /api/api-keys/:id   — revoke (deactivate) a key
 */

const express          = require('express');
const router           = express.Router();
const crypto           = require('crypto');
const bcrypt           = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { requireAuth, requireRole } = require('./auth');

const prisma = new PrismaClient();

// All routes require admin+
router.use(requireAuth);
router.use(requireRole('super-admin', 'admin'));

// ── GET /api/api-keys ─────────────────────────────────────────────────────────
router.get('/', async (_req, res, next) => {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        active: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    res.json(keys);
  } catch (err) { next(err); }
});

// ── POST /api/api-keys ────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { name, scopes, expiresAt } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required (e.g. "QuickBooks Sync")' });
    }

    // Generate key: mbc_ + 40 random hex chars = 44 chars total
    const rawHex = crypto.randomBytes(20).toString('hex'); // 40 hex chars
    const plainKey = `mbc_${rawHex}`;
    const prefix   = plainKey.substring(0, 8); // "mbc_" + first 4 hex

    // Hash for storage
    const hashedKey = await bcrypt.hash(plainKey, 12);

    const record = await prisma.apiKey.create({
      data: {
        name:        name.trim(),
        prefix,
        hashedKey,
        scopes:      scopes || 'read,write',
        createdById: req.user.id,
        expiresAt:   expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Return plaintext key ONCE — it cannot be retrieved again
    res.status(201).json({
      id:        record.id,
      name:      record.name,
      key:       plainKey,
      prefix:    record.prefix,
      scopes:    record.scopes,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      message:   'Save this key now — it will not be shown again.',
    });
  } catch (err) { next(err); }
});

// ── DELETE /api/api-keys/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) return res.status(404).json({ error: 'API key not found' });

    await prisma.apiKey.update({
      where: { id },
      data:  { active: false },
    });

    res.json({ success: true, message: `API key "${key.name}" revoked.` });
  } catch (err) { next(err); }
});

module.exports = router;
