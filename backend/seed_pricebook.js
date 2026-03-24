/**
 * seed_pricebook.js
 * Pricebook seed template — no items are pre-populated.
 * Each business must provide their own pricing data.
 *
 * To seed custom items, add them to the ITEMS array below
 * following the format shown in the example, then run:
 *   node seed_pricebook.js
 *
 * Or add items directly via the Pricebook page in the UI.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const brand = require('../brand.config');

const prisma = new PrismaClient();

// ── Add your business-specific pricebook items here ─────────────────────────
// Example format (uncomment and customize):
//
// const ITEMS = [
//   { industry: 'Electrical', category: 'Labor',   name: 'Standard Hourly Rate',  price: 125, cost: 0,   unit: 'hour', taxable: false },
//   { industry: 'Electrical', category: 'Service', name: 'Panel Upgrade 200A',    price: 2800, cost: 1400, unit: 'ea', taxable: true },
// ];
//
// Supported industries: Electrical | Plumbing | HVAC | General Contracting
// Supported units: hour | ea | sqft | lft | sq | day

const ITEMS = [];

async function main() {
  const industry = brand.industryLabel;

  if (ITEMS.length === 0) {
    console.log('No pricebook items to seed.');
    console.log(`Add your ${industry} pricing items to the ITEMS array in seed_pricebook.js,`);
    console.log('or add them via the Pricebook page in the UI.');
    return;
  }

  console.log(`Seeding pricebook for industry="${industry}" (${ITEMS.length} items)...`);

  let created = 0;
  let skipped = 0;

  for (const item of ITEMS) {
    const exists = await prisma.priceBookItem.findFirst({
      where: { industry: item.industry || industry, category: item.category, name: item.name },
    });
    if (exists) {
      skipped++;
      continue;
    }
    await prisma.priceBookItem.create({
      data: { industry: item.industry || industry, ...item },
    });
    created++;
  }

  console.log(`Done. Created: ${created}, Skipped (already exist): ${skipped}`);
  console.log(`Total items in pricebook: ${await prisma.priceBookItem.count()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
