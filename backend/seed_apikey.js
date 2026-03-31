/**
 * seed_apikey.js
 * Generates an initial API key for the company.
 *
 * Usage:
 *   node seed_apikey.js
 *   API_KEY_NAME="QuickBooks Sync" node seed_apikey.js
 *
 * The plaintext key is printed to stdout — save it immediately.
 * It cannot be retrieved again (only the hash is stored).
 */

require('dotenv').config();
const crypto           = require('crypto');
const bcrypt           = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const KEY_NAME = process.env.API_KEY_NAME || 'Default Integration Key';

async function main() {
  // Find the first admin/super-admin to associate as creator
  const admin = await prisma.user.findFirst({
    where: { role: { in: ['super-admin', 'admin'] }, active: true },
    orderBy: { id: 'asc' },
  });

  if (!admin) {
    console.error('No admin user found. Run seed_superadmin.js first.');
    process.exit(1);
  }

  // Generate key: mbc_ + 40 random hex chars
  const rawHex   = crypto.randomBytes(20).toString('hex');
  const plainKey  = `mbc_${rawHex}`;
  const prefix    = plainKey.substring(0, 8);
  const hashedKey = await bcrypt.hash(plainKey, 12);

  // Check for duplicate prefix (extremely unlikely)
  const existing = await prisma.apiKey.findUnique({ where: { prefix } });
  if (existing) {
    console.error('Prefix collision — please run again.');
    process.exit(1);
  }

  const record = await prisma.apiKey.create({
    data: {
      name:        KEY_NAME,
      prefix,
      hashedKey,
      scopes:      'read,write',
      createdById: admin.id,
    },
  });

  console.log('');
  console.log('=== API Key Created ===');
  console.log(`  Name:    ${record.name}`);
  console.log(`  ID:      ${record.id}`);
  console.log(`  Prefix:  ${record.prefix}****`);
  console.log(`  Scopes:  ${record.scopes}`);
  console.log(`  Creator: ${admin.firstName} ${admin.lastName} (${admin.email})`);
  console.log('');
  console.log('  KEY (save this now — it will NOT be shown again):');
  console.log(`  ${plainKey}`);
  console.log('');
  console.log('  Usage:');
  console.log('    curl -H "X-API-Key: ' + plainKey + '" https://yourdomain.com/api/jobs');
  console.log('');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
