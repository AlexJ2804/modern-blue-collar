/**
 * helpers/optimisticUpdate.js
 * Shared helper for optimistic locking. Checks version before saving.
 * Returns 409 on version mismatch.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @param {string} model - Prisma model name (e.g. 'job', 'customer', 'quote', 'invoice')
 * @param {number} id - Record ID
 * @param {object} data - Update data (must include `version` from client)
 * @param {object} [options] - Optional { include } for Prisma
 * @returns {object} Updated record
 * @throws 409 error if version mismatch
 */
async function optimisticUpdate(model, id, data, options = {}) {
  const clientVersion = data.version;

  if (clientVersion == null) {
    // No version sent — skip optimistic locking (backwards compat)
    const updated = await prisma[model].update({
      where: { id },
      data: { ...data, version: { increment: 1 } },
      ...options,
    });
    return updated;
  }

  // Check current version
  const current = await prisma[model].findUnique({ where: { id } });
  if (!current) {
    const err = new Error(`${model} not found`);
    err.status = 404;
    throw err;
  }

  if (current.version !== Number(clientVersion)) {
    const err = new Error(
      `Conflict: This ${model} has been modified by another user. Please refresh and try again.`
    );
    err.status = 409;
    throw err;
  }

  // Remove version from data, auto-increment it
  const { version: _v, ...updateData } = data;
  const updated = await prisma[model].update({
    where: { id },
    data: { ...updateData, version: { increment: 1 } },
    ...options,
  });
  return updated;
}

module.exports = { optimisticUpdate, prisma };
