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

const ITEMS = [
  // ── Plumbing Labor ──────────────────────────────────────────────────────────
  { category: 'Labor',   name: 'Standard Service Call',       price: 89,   cost: 0,    unit: 'ea',   taxable: false, description: 'Diagnostic visit / first 30 min' },
  { category: 'Labor',   name: 'Plumbing Hourly Rate',        price: 125,  cost: 0,    unit: 'hour', taxable: false, description: 'Standard plumbing labor' },
  { category: 'Labor',   name: 'After-Hours / Emergency',     price: 195,  cost: 0,    unit: 'hour', taxable: false, description: 'Evenings, weekends, holidays' },

  // ── Plumbing Services ───────────────────────────────────────────────────────
  { category: 'Plumbing Service', name: 'Leak Repair – Minor',           price: 175,  cost: 25,   unit: 'ea', taxable: true,  description: 'Faucet, supply line, or fitting leak' },
  { category: 'Plumbing Service', name: 'Leak Repair – Major / Pipe',    price: 450,  cost: 80,   unit: 'ea', taxable: true,  description: 'Pipe section repair or replacement' },
  { category: 'Plumbing Service', name: 'Drain Cleaning – Snake',        price: 225,  cost: 10,   unit: 'ea', taxable: true,  description: 'Cable machine drain clearing' },
  { category: 'Plumbing Service', name: 'Drain Cleaning – Hydro-Jet',    price: 550,  cost: 40,   unit: 'ea', taxable: true,  description: 'High-pressure water jetting' },
  { category: 'Plumbing Service', name: 'Water Heater Install – Tank',   price: 1800, cost: 650,  unit: 'ea', taxable: true,  description: '40-50 gal tank water heater' },
  { category: 'Plumbing Service', name: 'Water Heater Install – Tankless', price: 3200, cost: 1200, unit: 'ea', taxable: true, description: 'Tankless / on-demand unit' },
  { category: 'Plumbing Service', name: 'Water Heater Repair',           price: 350,  cost: 60,   unit: 'ea', taxable: true,  description: 'Element, thermostat, anode rod' },
  { category: 'Plumbing Service', name: 'Fixture Install – Faucet',      price: 225,  cost: 45,   unit: 'ea', taxable: true,  description: 'Kitchen or bath faucet' },
  { category: 'Plumbing Service', name: 'Fixture Install – Toilet',      price: 350,  cost: 120,  unit: 'ea', taxable: true,  description: 'Remove & replace toilet' },
  { category: 'Plumbing Service', name: 'Fixture Install – Garbage Disposal', price: 375, cost: 130, unit: 'ea', taxable: true, description: 'Disposal unit with wiring' },
  { category: 'Plumbing Service', name: 'Sewer Line Camera Inspection',  price: 325,  cost: 15,   unit: 'ea', taxable: true,  description: 'Video inspection with locator' },
  { category: 'Plumbing Service', name: 'Sewer Line Repair / Replace',   price: 4500, cost: 1500, unit: 'ea', taxable: true,  description: 'Excavation and pipe replacement' },
  { category: 'Plumbing Service', name: 'Sump Pump Install',             price: 1200, cost: 350,  unit: 'ea', taxable: true,  description: 'Sump pump with check valve' },
  { category: 'Plumbing Service', name: 'Gas Line Install / Repair',     price: 600,  cost: 100,  unit: 'ea', taxable: true,  description: 'Gas piping work with leak test' },
  { category: 'Plumbing Service', name: 'Water Softener Install',        price: 1500, cost: 500,  unit: 'ea', taxable: true,  description: 'Whole-house water softener' },
  { category: 'Plumbing Service', name: 'Whole-House Repipe',            price: 8500, cost: 2800, unit: 'ea', taxable: true,  description: 'Complete copper or PEX repipe' },

  // ── HVAC Labor ──────────────────────────────────────────────────────────────
  { category: 'Labor',   name: 'HVAC Hourly Rate',            price: 135,  cost: 0,    unit: 'hour', taxable: false, description: 'Standard HVAC labor' },
  { category: 'Labor',   name: 'HVAC Diagnostic Fee',         price: 89,   cost: 0,    unit: 'ea',   taxable: false, description: 'System diagnostic / first 30 min' },

  // ── HVAC Services ───────────────────────────────────────────────────────────
  { category: 'HVAC Service', name: 'AC Install – Central',          price: 5500,  cost: 2200, unit: 'ea', taxable: true, description: 'Central AC system up to 3 ton' },
  { category: 'HVAC Service', name: 'AC Install – Mini Split',       price: 3800,  cost: 1400, unit: 'ea', taxable: true, description: 'Ductless mini-split single zone' },
  { category: 'HVAC Service', name: 'AC Repair – Refrigerant',       price: 350,   cost: 80,   unit: 'ea', taxable: true, description: 'Leak repair and recharge' },
  { category: 'HVAC Service', name: 'AC Repair – Compressor',        price: 1800,  cost: 700,  unit: 'ea', taxable: true, description: 'Compressor replacement' },
  { category: 'HVAC Service', name: 'AC Repair – General',           price: 425,   cost: 90,   unit: 'ea', taxable: true, description: 'Capacitor, contactor, fan motor' },
  { category: 'HVAC Service', name: 'Furnace Install – Gas',         price: 4200,  cost: 1600, unit: 'ea', taxable: true, description: 'Gas furnace up to 80k BTU' },
  { category: 'HVAC Service', name: 'Furnace Install – Heat Pump',   price: 6500,  cost: 2800, unit: 'ea', taxable: true, description: 'Heat pump system' },
  { category: 'HVAC Service', name: 'Furnace Repair – Ignitor',      price: 275,   cost: 45,   unit: 'ea', taxable: true, description: 'Hot surface ignitor replacement' },
  { category: 'HVAC Service', name: 'Furnace Repair – Blower Motor', price: 650,   cost: 200,  unit: 'ea', taxable: true, description: 'Blower motor replacement' },
  { category: 'HVAC Service', name: 'Furnace Repair – General',      price: 375,   cost: 70,   unit: 'ea', taxable: true, description: 'Flame sensor, thermocouple, board' },
  { category: 'HVAC Service', name: 'Duct Work – New Run',           price: 850,   cost: 250,  unit: 'ea', taxable: true, description: 'Single duct run with register' },
  { category: 'HVAC Service', name: 'Duct Work – Sealing & Insulation', price: 1200, cost: 300, unit: 'ea', taxable: true, description: 'Whole-system duct sealing' },
  { category: 'HVAC Service', name: 'Tune-Up – AC',                  price: 129,   cost: 10,   unit: 'ea', taxable: true, description: 'Annual AC maintenance' },
  { category: 'HVAC Service', name: 'Tune-Up – Furnace',             price: 129,   cost: 10,   unit: 'ea', taxable: true, description: 'Annual heating maintenance' },
  { category: 'HVAC Service', name: 'Thermostat Install – Smart',    price: 325,   cost: 120,  unit: 'ea', taxable: true, description: 'Smart thermostat with WiFi setup' },
  { category: 'HVAC Service', name: 'Indoor Air Quality – UV Light', price: 650,   cost: 200,  unit: 'ea', taxable: true, description: 'UV germicidal lamp install' },
  { category: 'HVAC Service', name: 'Indoor Air Quality – Whole-House Filter', price: 450, cost: 150, unit: 'ea', taxable: true, description: 'Media air cleaner install' },
];

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
