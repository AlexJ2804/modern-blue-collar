/**
 * seed_pricebook.js
  * Seeds starter pricebook items for each supported trade type.
   * The `industry` field is driven by BRAND_INDUSTRY_LABEL / brand.config.js.
    *
     * Usage:
      *   node seed_pricebook.js
       */

       require('dotenv').config();
       const { PrismaClient } = require('@prisma/client');
       const brand = require('../brand.config');

       const prisma = new PrismaClient();

       // ── Starter items per trade ────────────────────────────────────────────────────
       const ITEMS_BY_TRADE = {
         electrical: [
             { category: 'Labor',    name: 'Standard Hourly Rate',     price: 125, cost: 0,   unit: 'hour',   taxable: false },
                 { category: 'Labor',    name: 'Emergency / After-Hours',  price: 185, cost: 0,   unit: 'hour',   taxable: false },
                     { category: 'Panel',    name: 'Panel Upgrade 200A',       price: 2800,cost: 1400, unit: 'ea',    taxable: true  },
                         { category: 'Panel',    name: 'Panel Upgrade 400A',       price: 4200,cost: 2100, unit: 'ea',    taxable: true  },
                             { category: 'Outlets',  name: 'Outlet Install (duplex)',  price: 145, cost: 25,   unit: 'ea',    taxable: true  },
                                 { category: 'Outlets',  name: 'GFCI Outlet Install',      price: 165, cost: 35,   unit: 'ea',    taxable: true  },
                                     { category: 'Lighting', name: 'Can Light Install',        price: 95,  cost: 15,   unit: 'ea',    taxable: true  },
                                         { category: 'Lighting', name: 'Ceiling Fan Install',      price: 185, cost: 45,   unit: 'ea',    taxable: true  },
                                             { category: 'EV',       name: 'EV Charger Install (L2)',  price: 850, cost: 320,  unit: 'ea',    taxable: true  },
                                                 { category: 'Service',  name: 'Circuit Breaker Replace',  price: 195, cost: 40,   unit: 'ea',    taxable: true  },
                                                   ],
                                                     plumbing: [
                                                         { category: 'Labor',       name: 'Standard Hourly Rate',     price: 115, cost: 0,   unit: 'hour',  taxable: false },
                                                             { category: 'Labor',       name: 'Emergency / After-Hours',  price: 175, cost: 0,   unit: 'hour',  taxable: false },
                                                                 { category: 'Water Heater',name: 'Water Heater Install (40g)',price: 1200,cost: 650, unit: 'ea',   taxable: true  },
                                                                     { category: 'Water Heater',name: 'Water Heater Install (50g)',price: 1400,cost: 750, unit: 'ea',   taxable: true  },
                                                                         { category: 'Drain',       name: 'Drain Cleaning (snake)',   price: 195, cost: 20,  unit: 'ea',   taxable: false },
                                                                             { category: 'Drain',       name: 'Hydro-Jetting',            price: 450, cost: 80,  unit: 'ea',   taxable: false },
                                                                                 { category: 'Fixture',     name: 'Faucet Install',           price: 175, cost: 45,  unit: 'ea',   taxable: true  },
                                                                                     { category: 'Fixture',     name: 'Toilet Install',           price: 275, cost: 95,  unit: 'ea',   taxable: true  },
                                                                                         { category: 'Fixture',     name: 'Garbage Disposal Install', price: 325, cost: 135, unit: 'ea',   taxable: true  },
                                                                                             { category: 'Leak',        name: 'Leak Repair (minor)',      price: 225, cost: 25,  unit: 'ea',   taxable: false },
                                                                                               ],
                                                                                                 hvac: [
                                                                                                     { category: 'Labor',      name: 'Standard Hourly Rate',      price: 135, cost: 0,    unit: 'hour', taxable: false },
                                                                                                         { category: 'Labor',      name: 'Emergency / After-Hours',   price: 200, cost: 0,    unit: 'hour', taxable: false },
                                                                                                             { category: 'AC',         name: 'AC Tune-Up',                price: 129, cost: 30,   unit: 'ea',   taxable: false },
                                                                                                                 { category: 'AC',         name: 'AC Install (2-ton split)',  price: 3800,cost: 2200, unit: 'ea',   taxable: true  },
                                                                                                                     { category: 'AC',         name: 'AC Install (3-ton split)',  price: 4500,cost: 2700, unit: 'ea',   taxable: true  },
                                                                                                                         { category: 'Furnace',    name: 'Furnace Install (80K BTU)', price: 2800,cost: 1600, unit: 'ea',   taxable: true  },
                                                                                                                             { category: 'Furnace',    name: 'Furnace Tune-Up',           price: 109, cost: 25,   unit: 'ea',   taxable: false },
                                                                                                                                 { category: 'Ductwork',   name: 'Duct Cleaning',             price: 395, cost: 80,   unit: 'ea',   taxable: false },
                                                                                                                                     { category: 'Maintenance',name: 'Filter Replacement',        price: 45,  cost: 15,   unit: 'ea',   taxable: true  },
                                                                                                                                         { category: 'Repair',     name: 'Refrigerant Recharge (R410A)',price:285, cost:120,  unit: 'ea',   taxable: true  },
                                                                                                                                           ],
                                                                                                                                             contracting: [
                                                                                                                                                 { category: 'Labor',    name: 'Crew Day Rate (2-man)',     price: 850, cost: 0,    unit: 'day',  taxable: false },
                                                                                                                                                     { category: 'Labor',    name: 'Lead Carpenter Hourly',    price: 95,  cost: 0,    unit: 'hour', taxable: false },
                                                                                                                                                         { category: 'Framing',  name: 'Framing (linear ft)',      price: 12,  cost: 4,    unit: 'lft',  taxable: true  },
                                                                                                                                                             { category: 'Drywall',  name: 'Drywall Install (sqft)',   price: 3.5, cost: 1,    unit: 'sqft', taxable: true  },
                                                                                                                                                                 { category: 'Drywall',  name: 'Drywall Finish Level 4',   price: 2.5, cost: 0.8,  unit: 'sqft', taxable: true  },
                                                                                                                                                                     { category: 'Flooring', name: 'LVP Install (sqft)',       price: 5,   cost: 2,    unit: 'sqft', taxable: true  },
                                                                                                                                                                         { category: 'Painting', name: 'Interior Paint (sqft)',    price: 2.5, cost: 0.75, unit: 'sqft', taxable: true  },
                                                                                                                                                                             { category: 'Roofing',  name: 'Shingle Roof (square)',    price: 450, cost: 250,  unit: 'sq',   taxable: true  },
                                                                                                                                                                                 { category: 'Demo',     name: 'Demo / Haul Away (hour)',  price: 95,  cost: 15,   unit: 'hour', taxable: false },
                                                                                                                                                                                     { category: 'Permits',  name: 'Permit Application Fee',   price: 150, cost: 0,    unit: 'ea',   taxable: false },
                                                                                                                                                                                       ],
                                                                                                                                                                                       };
                                                                                                                                                                                       
                                                                                                                                                                                       async function main() {
                                                                                                                                                                                         const industry = brand.industryLabel;
                                                                                                                                                                                           const trade    = brand.tradeType;
                                                                                                                                                                                             const items    = ITEMS_BY_TRADE[trade] || ITEMS_BY_TRADE.electrical;
                                                                                                                                                                                             
                                                                                                                                                                                               console.log(`Seeding pricebook for trade="${trade}" industry="${industry}" (${items.length} items)...`);
                                                                                                                                                                                               
                                                                                                                                                                                                 let created = 0;
                                                                                                                                                                                                   let skipped = 0;
                                                                                                                                                                                                   
                                                                                                                                                                                                     for (const item of items) {
                                                                                                                                                                                                         const exists = await prisma.priceBookItem.findFirst({
                                                                                                                                                                                                               where: { industry, category: item.category, name: item.name },
                                                                                                                                                                                                                   });
                                                                                                                                                                                                                       if (exists) {
                                                                                                                                                                                                                             skipped++;
                                                                                                                                                                                                                                   continue;
                                                                                                                                                                                                                                       }
                                                                                                                                                                                                                                           await prisma.priceBookItem.create({
                                                                                                                                                                                                                                                 data: { industry, ...item },
                                                                                                                                                                                                                                                     });
                                                                                                                                                                                                                                                         created++;
                                                                                                                                                                                                                                                           }
                                                                                                                                                                                                                                                           
                                                                                                                                                                                                                                                             console.log(`Done. Created: ${created}, Skipped (already exist): ${skipped}`);
                                                                                                                                                                                                                                                             }
                                                                                                                                                                                                                                                             
                                                                                                                                                                                                                                                             main()
                                                                                                                                                                                                                                                               .catch(console.error)
                                                                                                                                                                                                                                                                 .finally(() => prisma.$disconnect());
                                                                                                                                                                                                                                                                 
