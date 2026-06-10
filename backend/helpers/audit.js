/**
 * helpers/audit.js — minimal append-only audit trail.
 *
 * Currently used to record platform-support (ghost admin) sign-ins and writes,
 * so each client has a record of when support accessed their instance.
 *
 * Writes are best-effort: an audit failure must never break the request it is
 * recording, so errors are logged and swallowed.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function writeAudit({ userId = null, action, detail = null, ip = null }) {
  try {
    await prisma.auditLog.create({ data: { userId, action, detail, ip } });
  } catch (err) {
    console.error('[AUDIT] failed to write audit log:', err.message);
  }
}

module.exports = { writeAudit };
