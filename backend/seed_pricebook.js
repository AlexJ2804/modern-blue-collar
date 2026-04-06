/**
 * seed_pricebook.js
 * Pricebook for David Lies Plumbing Inc — Wichita, KS
 * Full-service residential & commercial plumbing since 1978.
 *
 * Usage:
 *   node seed_pricebook.js
 *
 * Prices are starting estimates — David Lies team should adjust to match
 * their actual pricing before going live.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const brand = require('../brand.config');

const prisma = new PrismaClient();

const ITEMS = [
  // ── Labor ───────────────────────────────────────────────────────────────────
  { category: 'Labor',   name: 'Service Call / Diagnostic',   price: 89,   cost: 0,    unit: 'ea',   taxable: false, description: 'Diagnostic visit, first 30 minutes' },
  { category: 'Labor',   name: 'Standard Hourly Rate',        price: 125,  cost: 0,    unit: 'hour', taxable: false, description: 'Standard plumbing labor' },
  { category: 'Labor',   name: 'After-Hours / Emergency',     price: 195,  cost: 0,    unit: 'hour', taxable: false, description: 'Evenings, weekends, holidays' },
  { category: 'Labor',   name: 'Apprentice Hourly Rate',      price: 75,   cost: 0,    unit: 'hour', taxable: false, description: 'Apprentice plumber labor' },

  // ── Drain & Sewer ──────────────────────────────────────────────────────────
  { category: 'Drain & Sewer', name: 'Drain Cleaning – Snake',          price: 225,  cost: 10,   unit: 'ea', taxable: true, description: 'Cable machine drain clearing' },
  { category: 'Drain & Sewer', name: 'Drain Cleaning – Hydro-Jet',      price: 550,  cost: 40,   unit: 'ea', taxable: true, description: 'High-pressure water jetting' },
  { category: 'Drain & Sewer', name: 'Sewer Line Camera Inspection',    price: 325,  cost: 15,   unit: 'ea', taxable: true, description: 'Video camera inspection with locator' },
  { category: 'Drain & Sewer', name: 'Sewer Line Cleaning',             price: 395,  cost: 30,   unit: 'ea', taxable: true, description: 'Main sewer line clearing' },
  { category: 'Drain & Sewer', name: 'Sewer Line Repair / Replace',     price: 4500, cost: 1500, unit: 'ea', taxable: true, description: 'Excavation and pipe replacement' },
  { category: 'Drain & Sewer', name: 'Area Drain Install',              price: 450,  cost: 120,  unit: 'ea', taxable: true, description: 'Floor or yard area drain' },
  { category: 'Drain & Sewer', name: 'Grease Trap Install',             price: 850,  cost: 300,  unit: 'ea', taxable: true, description: 'Commercial grease interceptor' },
  { category: 'Drain & Sewer', name: 'Grease Trap Cleaning',            price: 350,  cost: 40,   unit: 'ea', taxable: true, description: 'Grease trap pump-out and clean' },
  { category: 'Drain & Sewer', name: 'Sewage Ejector Pump Install',     price: 1400, cost: 500,  unit: 'ea', taxable: true, description: 'Sewage ejector system' },
  { category: 'Drain & Sewer', name: 'Sewage Ejector Pump Repair',      price: 450,  cost: 100,  unit: 'ea', taxable: true, description: 'Ejector pump service / replace' },

  // ── Water Heaters ──────────────────────────────────────────────────────────
  { category: 'Water Heater', name: 'Electric Water Heater Install',    price: 1600, cost: 600,  unit: 'ea', taxable: true, description: 'Standard electric tank (40-50 gal)' },
  { category: 'Water Heater', name: 'Gas Water Heater Install',         price: 1800, cost: 700,  unit: 'ea', taxable: true, description: 'Standard gas tank (40-50 gal)' },
  { category: 'Water Heater', name: 'Tankless Water Heater Install',    price: 3200, cost: 1200, unit: 'ea', taxable: true, description: 'On-demand tankless unit' },
  { category: 'Water Heater', name: 'Water Heater Repair',              price: 350,  cost: 60,   unit: 'ea', taxable: true, description: 'Element, thermostat, anode rod, T&P valve' },
  { category: 'Water Heater', name: 'Water Heater Flush',               price: 149,  cost: 5,    unit: 'ea', taxable: false, description: 'Sediment flush and inspection' },

  // ── Fixtures – Faucets ─────────────────────────────────────────────────────
  { category: 'Faucets & Fixtures', name: 'Kitchen Faucet Install',     price: 225,  cost: 45,   unit: 'ea', taxable: true, description: 'Remove & replace kitchen faucet' },
  { category: 'Faucets & Fixtures', name: 'Bathroom Faucet Install',    price: 195,  cost: 35,   unit: 'ea', taxable: true, description: 'Remove & replace bath faucet' },
  { category: 'Faucets & Fixtures', name: 'Faucet Repair',              price: 145,  cost: 15,   unit: 'ea', taxable: true, description: 'Cartridge, valve, or handle repair' },
  { category: 'Faucets & Fixtures', name: 'Garbage Disposal Install',   price: 375,  cost: 130,  unit: 'ea', taxable: true, description: 'Disposal unit with wiring hookup' },
  { category: 'Faucets & Fixtures', name: 'Sink Install',               price: 350,  cost: 80,   unit: 'ea', taxable: true, description: 'Kitchen or bathroom sink' },

  // ── Fixtures – Toilets ─────────────────────────────────────────────────────
  { category: 'Toilets', name: 'Toilet Install / Replace',              price: 350,  cost: 120,  unit: 'ea', taxable: true, description: 'Remove old & install new toilet' },
  { category: 'Toilets', name: 'Toilet Repair',                         price: 175,  cost: 20,   unit: 'ea', taxable: true, description: 'Flapper, fill valve, flush valve, wax ring' },
  { category: 'Toilets', name: 'Bidet Seat Install',                    price: 225,  cost: 60,   unit: 'ea', taxable: true, description: 'Bidet seat with supply connection' },

  // ── Fixtures – Bathtubs & Showers ──────────────────────────────────────────
  { category: 'Bathtub & Shower', name: 'Bathtub Install',              price: 1800, cost: 500,  unit: 'ea', taxable: true, description: 'Bathtub removal and replacement' },
  { category: 'Bathtub & Shower', name: 'Shower Valve Replace',         price: 425,  cost: 80,   unit: 'ea', taxable: true, description: 'Shower mixing valve replacement' },
  { category: 'Bathtub & Shower', name: 'Tub/Shower Diverter Repair',   price: 195,  cost: 25,   unit: 'ea', taxable: true, description: 'Diverter valve repair or replace' },

  // ── Sump Pumps ─────────────────────────────────────────────────────────────
  { category: 'Sump Pump', name: 'Sump Pump Install',                   price: 1200, cost: 350,  unit: 'ea', taxable: true, description: 'Primary sump pump with check valve (Zoeller)' },
  { category: 'Sump Pump', name: 'Sump Pump Replace',                   price: 650,  cost: 200,  unit: 'ea', taxable: true, description: 'Replace existing pump' },
  { category: 'Sump Pump', name: 'Battery Backup Sump Pump',            price: 950,  cost: 400,  unit: 'ea', taxable: true, description: 'Battery backup system install' },

  // ── Water Treatment ────────────────────────────────────────────────────────
  { category: 'Water Treatment', name: 'Water Softener Install',        price: 1500, cost: 500,  unit: 'ea', taxable: true, description: 'Whole-house water softener system' },
  { category: 'Water Treatment', name: 'Water Softener Repair',         price: 275,  cost: 40,   unit: 'ea', taxable: true, description: 'Softener valve, resin, or timer' },
  { category: 'Water Treatment', name: 'Water Purification System',     price: 1200, cost: 400,  unit: 'ea', taxable: true, description: 'Whole-house filtration or RO system' },
  { category: 'Water Treatment', name: 'Well System Service',           price: 450,  cost: 80,   unit: 'ea', taxable: true, description: 'Well pump, pressure tank, or controls' },

  // ── Gas Piping ─────────────────────────────────────────────────────────────
  { category: 'Gas Piping', name: 'Gas Line Install (appliance)',       price: 450,  cost: 100,  unit: 'ea', taxable: true, description: 'Gas line run to appliance' },
  { category: 'Gas Piping', name: 'Gas Line Repair',                    price: 395,  cost: 60,   unit: 'ea', taxable: true, description: 'Gas leak repair' },
  { category: 'Gas Piping', name: 'Gas Pressure Test',                  price: 195,  cost: 0,    unit: 'ea', taxable: false, description: 'System pressure test and certification' },

  // ── Pipe Repair & Repiping ─────────────────────────────────────────────────
  { category: 'Pipe Repair', name: 'Leak Repair – Minor',               price: 195,  cost: 20,   unit: 'ea', taxable: true, description: 'Supply line, fitting, or faucet leak' },
  { category: 'Pipe Repair', name: 'Leak Repair – Major / In-Wall',     price: 550,  cost: 80,   unit: 'ea', taxable: true, description: 'Pipe section repair behind wall/ceiling' },
  { category: 'Pipe Repair', name: 'Frozen Pipe Thaw & Repair',         price: 395,  cost: 30,   unit: 'ea', taxable: true, description: 'Thaw and inspect for burst' },
  { category: 'Pipe Repair', name: 'Whole-House Repipe',                price: 8500, cost: 2800, unit: 'ea', taxable: true, description: 'Complete copper or PEX repipe' },

  // ── Backflow & Air Lines ───────────────────────────────────────────────────
  { category: 'Backflow', name: 'Backflow Preventer Install',           price: 650,  cost: 200,  unit: 'ea', taxable: true, description: 'Backflow prevention device' },
  { category: 'Backflow', name: 'Backflow Test & Certification',        price: 150,  cost: 0,    unit: 'ea', taxable: false, description: 'Annual backflow test' },
  { category: 'Air Line',  name: 'Air Line System Install',             price: 750,  cost: 200,  unit: 'ea', taxable: true, description: 'Compressed air line piping' },

  // ── Commercial ─────────────────────────────────────────────────────────────
  { category: 'Commercial', name: 'Commercial Plumbing – Hourly',       price: 145,  cost: 0,    unit: 'hour', taxable: false, description: 'Commercial plumbing labor rate' },
  { category: 'Commercial', name: 'New Construction Rough-In',          price: 0,    cost: 0,    unit: 'ea',   taxable: true,  description: 'Bid per project — rough-in plumbing' },
  { category: 'Commercial', name: 'Bathroom Remodel Plumbing',          price: 0,    cost: 0,    unit: 'ea',   taxable: true,  description: 'Bid per project — remodel plumbing' },
];

async function main() {
  const industry = brand.industryLabel;

  if (ITEMS.length === 0) {
    console.log('No pricebook items to seed.');
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
