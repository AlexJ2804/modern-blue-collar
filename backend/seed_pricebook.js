/**
 * seed_pricebook.js
 * Seeds 152 pricebook items across all four trades:
 * Electrical, Plumbing, HVAC, and General Contracting.
 *
 * Usage:
 *   node seed_pricebook.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const brand = require('../brand.config');

const prisma = new PrismaClient();

// ── 152 items across all trades ─────────────────────────────────────────────
const ALL_ITEMS = [
  // ═══ ELECTRICAL (42 items) ═══════════════════════════════════════════════
  // Labor
  { industry: 'Electrical', category: 'Labor', name: 'Standard Hourly Rate', price: 125, cost: 0, unit: 'hour', taxable: false },
  { industry: 'Electrical', category: 'Labor', name: 'Emergency / After-Hours', price: 185, cost: 0, unit: 'hour', taxable: false },
  { industry: 'Electrical', category: 'Labor', name: 'Apprentice Hourly Rate', price: 75, cost: 0, unit: 'hour', taxable: false },
  { industry: 'Electrical', category: 'Labor', name: 'Service Call / Trip Charge', price: 89, cost: 0, unit: 'ea', taxable: false },
  // Panel
  { industry: 'Electrical', category: 'Panel', name: 'Panel Upgrade 200A', price: 2800, cost: 1400, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Panel', name: 'Panel Upgrade 400A', price: 4200, cost: 2100, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Panel', name: 'Sub-Panel Install 100A', price: 1800, cost: 800, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Panel', name: 'Panel Relocation', price: 3500, cost: 1500, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Panel', name: 'Meter Base Replace', price: 1200, cost: 450, unit: 'ea', taxable: true },
  // Outlets & Switches
  { industry: 'Electrical', category: 'Outlets', name: 'Outlet Install (duplex)', price: 145, cost: 25, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Outlets', name: 'GFCI Outlet Install', price: 165, cost: 35, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Outlets', name: 'USB Outlet Install', price: 155, cost: 30, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Outlets', name: '240V Outlet Install', price: 295, cost: 55, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Outlets', name: 'Outdoor Outlet Install (weatherproof)', price: 225, cost: 45, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Outlets', name: 'Dimmer Switch Install', price: 135, cost: 28, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Outlets', name: 'Smart Switch Install', price: 175, cost: 55, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Outlets', name: 'Whole-Room Wiring (new construction)', price: 650, cost: 180, unit: 'ea', taxable: true },
  // Lighting
  { industry: 'Electrical', category: 'Lighting', name: 'Can Light Install', price: 95, cost: 15, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Lighting', name: 'Ceiling Fan Install', price: 185, cost: 45, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Lighting', name: 'Chandelier Install', price: 225, cost: 30, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Lighting', name: 'Under-Cabinet LED Strip', price: 175, cost: 40, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Lighting', name: 'Landscape Lighting (per fixture)', price: 195, cost: 65, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Lighting', name: 'Motion Sensor Light', price: 165, cost: 45, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Lighting', name: 'Flood Light Install', price: 195, cost: 55, unit: 'ea', taxable: true },
  // EV
  { industry: 'Electrical', category: 'EV', name: 'EV Charger Install (L2)', price: 850, cost: 320, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'EV', name: 'EV Charger Install (L2 with panel upgrade)', price: 3200, cost: 1600, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'EV', name: 'Tesla Wall Connector Install', price: 750, cost: 280, unit: 'ea', taxable: true },
  // Service & Safety
  { industry: 'Electrical', category: 'Service', name: 'Circuit Breaker Replace', price: 195, cost: 40, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Service', name: 'AFCI Breaker Install', price: 225, cost: 65, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Service', name: 'Whole-House Surge Protector', price: 395, cost: 150, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Service', name: 'Smoke Detector Install (hardwired)', price: 125, cost: 35, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Service', name: 'CO Detector Install', price: 125, cost: 35, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Service', name: 'Electrical Inspection / Safety Audit', price: 275, cost: 0, unit: 'ea', taxable: false },
  { industry: 'Electrical', category: 'Service', name: 'Wire Repair (per run)', price: 350, cost: 80, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Service', name: 'Knob & Tube Remediation (per circuit)', price: 1200, cost: 400, unit: 'ea', taxable: true },
  // Generator
  { industry: 'Electrical', category: 'Generator', name: 'Generator Transfer Switch Install', price: 1200, cost: 450, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Generator', name: 'Portable Generator Hookup', price: 650, cost: 200, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Generator', name: 'Whole-House Generator Install', price: 8500, cost: 5500, unit: 'ea', taxable: true },
  // Data & Low Voltage
  { industry: 'Electrical', category: 'Data', name: 'Cat6 Network Drop', price: 195, cost: 35, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Data', name: 'Coax Cable Run', price: 145, cost: 20, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Data', name: 'Doorbell Camera Install', price: 195, cost: 60, unit: 'ea', taxable: true },
  { industry: 'Electrical', category: 'Data', name: 'Home Theater Wiring', price: 450, cost: 100, unit: 'ea', taxable: true },

  // ═══ PLUMBING (40 items) ═════════════════════════════════════════════════
  // Labor
  { industry: 'Plumbing', category: 'Labor', name: 'Standard Hourly Rate', price: 115, cost: 0, unit: 'hour', taxable: false },
  { industry: 'Plumbing', category: 'Labor', name: 'Emergency / After-Hours', price: 175, cost: 0, unit: 'hour', taxable: false },
  { industry: 'Plumbing', category: 'Labor', name: 'Apprentice Hourly Rate', price: 65, cost: 0, unit: 'hour', taxable: false },
  { industry: 'Plumbing', category: 'Labor', name: 'Service Call / Trip Charge', price: 79, cost: 0, unit: 'ea', taxable: false },
  // Water Heater
  { industry: 'Plumbing', category: 'Water Heater', name: 'Water Heater Install (40g)', price: 1200, cost: 650, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Water Heater', name: 'Water Heater Install (50g)', price: 1400, cost: 750, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Water Heater', name: 'Water Heater Install (75g)', price: 1800, cost: 950, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Water Heater', name: 'Tankless Water Heater Install', price: 2800, cost: 1500, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Water Heater', name: 'Water Heater Flush', price: 149, cost: 10, unit: 'ea', taxable: false },
  { industry: 'Plumbing', category: 'Water Heater', name: 'Anode Rod Replace', price: 195, cost: 35, unit: 'ea', taxable: true },
  // Drain
  { industry: 'Plumbing', category: 'Drain', name: 'Drain Cleaning (snake)', price: 195, cost: 20, unit: 'ea', taxable: false },
  { industry: 'Plumbing', category: 'Drain', name: 'Hydro-Jetting', price: 450, cost: 80, unit: 'ea', taxable: false },
  { industry: 'Plumbing', category: 'Drain', name: 'Camera Inspection', price: 275, cost: 30, unit: 'ea', taxable: false },
  { industry: 'Plumbing', category: 'Drain', name: 'Main Sewer Line Repair', price: 3500, cost: 1500, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Drain', name: 'Floor Drain Install', price: 450, cost: 120, unit: 'ea', taxable: true },
  // Fixture
  { industry: 'Plumbing', category: 'Fixture', name: 'Faucet Install', price: 175, cost: 45, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Fixture', name: 'Toilet Install', price: 275, cost: 95, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Fixture', name: 'Garbage Disposal Install', price: 325, cost: 135, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Fixture', name: 'Shower Valve Replace', price: 395, cost: 120, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Fixture', name: 'Bathtub Install', price: 1800, cost: 800, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Fixture', name: 'Sink Install (kitchen)', price: 350, cost: 100, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Fixture', name: 'Sink Install (bathroom)', price: 295, cost: 80, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Fixture', name: 'Bidet Install', price: 375, cost: 120, unit: 'ea', taxable: true },
  // Leak & Pipe
  { industry: 'Plumbing', category: 'Leak', name: 'Leak Repair (minor)', price: 225, cost: 25, unit: 'ea', taxable: false },
  { industry: 'Plumbing', category: 'Leak', name: 'Leak Repair (major / in-wall)', price: 650, cost: 100, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Leak', name: 'Slab Leak Repair', price: 2500, cost: 800, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Pipe', name: 'Pipe Repair (copper, per joint)', price: 195, cost: 30, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Pipe', name: 'Pipe Repair (PEX, per joint)', price: 145, cost: 15, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Pipe', name: 'Whole-House Repipe (PEX)', price: 6500, cost: 3000, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Pipe', name: 'Frozen Pipe Thaw', price: 350, cost: 30, unit: 'ea', taxable: false },
  // Gas
  { industry: 'Plumbing', category: 'Gas', name: 'Gas Line Install (appliance)', price: 450, cost: 120, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Gas', name: 'Gas Line Leak Repair', price: 395, cost: 60, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Gas', name: 'Gas Pressure Test', price: 195, cost: 0, unit: 'ea', taxable: false },
  // Water Treatment
  { industry: 'Plumbing', category: 'Water Treatment', name: 'Water Softener Install', price: 1500, cost: 700, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Water Treatment', name: 'Reverse Osmosis System', price: 850, cost: 350, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Water Treatment', name: 'Whole-House Filter Install', price: 950, cost: 400, unit: 'ea', taxable: true },
  // Sump & Ejector
  { industry: 'Plumbing', category: 'Sump', name: 'Sump Pump Install', price: 650, cost: 250, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Sump', name: 'Sump Pump Replace', price: 450, cost: 175, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Sump', name: 'Battery Backup Sump Pump', price: 850, cost: 400, unit: 'ea', taxable: true },
  { industry: 'Plumbing', category: 'Sump', name: 'Ejector Pump Install', price: 1200, cost: 550, unit: 'ea', taxable: true },

  // ═══ HVAC (38 items) ═════════════════════════════════════════════════════
  // Labor
  { industry: 'HVAC', category: 'Labor', name: 'Standard Hourly Rate', price: 135, cost: 0, unit: 'hour', taxable: false },
  { industry: 'HVAC', category: 'Labor', name: 'Emergency / After-Hours', price: 200, cost: 0, unit: 'hour', taxable: false },
  { industry: 'HVAC', category: 'Labor', name: 'Apprentice Hourly Rate', price: 75, cost: 0, unit: 'hour', taxable: false },
  { industry: 'HVAC', category: 'Labor', name: 'Service Call / Diagnostic', price: 89, cost: 0, unit: 'ea', taxable: false },
  // AC
  { industry: 'HVAC', category: 'AC', name: 'AC Tune-Up', price: 129, cost: 30, unit: 'ea', taxable: false },
  { industry: 'HVAC', category: 'AC', name: 'AC Install (2-ton split)', price: 3800, cost: 2200, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'AC', name: 'AC Install (3-ton split)', price: 4500, cost: 2700, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'AC', name: 'AC Install (4-ton split)', price: 5200, cost: 3200, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'AC', name: 'AC Install (5-ton split)', price: 5900, cost: 3700, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'AC', name: 'AC Condenser Replace', price: 2800, cost: 1600, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'AC', name: 'AC Evaporator Coil Replace', price: 1800, cost: 900, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'AC', name: 'AC Compressor Replace', price: 2200, cost: 1200, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'AC', name: 'Window AC Unit Install', price: 195, cost: 30, unit: 'ea', taxable: false },
  { industry: 'HVAC', category: 'AC', name: 'Mini-Split Install (single zone)', price: 3200, cost: 1800, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'AC', name: 'Mini-Split Install (multi-zone, 2 heads)', price: 5500, cost: 3200, unit: 'ea', taxable: true },
  // Furnace & Heat
  { industry: 'HVAC', category: 'Furnace', name: 'Furnace Install (80K BTU)', price: 2800, cost: 1600, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Furnace', name: 'Furnace Install (100K BTU)', price: 3400, cost: 2000, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Furnace', name: 'Furnace Tune-Up', price: 109, cost: 25, unit: 'ea', taxable: false },
  { industry: 'HVAC', category: 'Furnace', name: 'Heat Exchanger Replace', price: 2500, cost: 1400, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Furnace', name: 'Ignitor Replace', price: 225, cost: 45, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Furnace', name: 'Blower Motor Replace', price: 650, cost: 280, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Furnace', name: 'Heat Pump Install (3-ton)', price: 5500, cost: 3200, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Furnace', name: 'Heat Pump Install (4-ton)', price: 6500, cost: 3800, unit: 'ea', taxable: true },
  // Ductwork
  { industry: 'HVAC', category: 'Ductwork', name: 'Duct Cleaning', price: 395, cost: 80, unit: 'ea', taxable: false },
  { industry: 'HVAC', category: 'Ductwork', name: 'Duct Sealing', price: 550, cost: 120, unit: 'ea', taxable: false },
  { industry: 'HVAC', category: 'Ductwork', name: 'Duct Install (new run)', price: 450, cost: 150, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Ductwork', name: 'Duct Repair', price: 295, cost: 60, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Ductwork', name: 'Duct Insulation (per linear ft)', price: 8, cost: 3, unit: 'lft', taxable: true },
  // Maintenance & Parts
  { industry: 'HVAC', category: 'Maintenance', name: 'Filter Replacement', price: 45, cost: 15, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Maintenance', name: 'Capacitor Replace', price: 195, cost: 35, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Maintenance', name: 'Contactor Replace', price: 225, cost: 40, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Maintenance', name: 'Thermostat Install (programmable)', price: 195, cost: 65, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Maintenance', name: 'Smart Thermostat Install', price: 295, cost: 150, unit: 'ea', taxable: true },
  // Refrigerant & Repair
  { industry: 'HVAC', category: 'Repair', name: 'Refrigerant Recharge (R410A)', price: 285, cost: 120, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Repair', name: 'Refrigerant Recharge (R22)', price: 450, cost: 250, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'Repair', name: 'Refrigerant Leak Repair', price: 550, cost: 150, unit: 'ea', taxable: true },
  // IAQ
  { industry: 'HVAC', category: 'IAQ', name: 'UV Light Install (duct-mount)', price: 495, cost: 200, unit: 'ea', taxable: true },
  { industry: 'HVAC', category: 'IAQ', name: 'Whole-House Humidifier Install', price: 650, cost: 280, unit: 'ea', taxable: true },

  // ═══ GENERAL CONTRACTING (32 items) ══════════════════════════════════════
  // Labor
  { industry: 'General Contracting', category: 'Labor', name: 'Crew Day Rate (2-man)', price: 850, cost: 0, unit: 'day', taxable: false },
  { industry: 'General Contracting', category: 'Labor', name: 'Lead Carpenter Hourly', price: 95, cost: 0, unit: 'hour', taxable: false },
  { industry: 'General Contracting', category: 'Labor', name: 'Laborer Hourly', price: 55, cost: 0, unit: 'hour', taxable: false },
  { industry: 'General Contracting', category: 'Labor', name: 'Project Manager (per day)', price: 450, cost: 0, unit: 'day', taxable: false },
  // Framing
  { industry: 'General Contracting', category: 'Framing', name: 'Framing (linear ft)', price: 12, cost: 4, unit: 'lft', taxable: true },
  { industry: 'General Contracting', category: 'Framing', name: 'Header Install (4x12)', price: 350, cost: 120, unit: 'ea', taxable: true },
  { industry: 'General Contracting', category: 'Framing', name: 'Wall Framing (8ft section)', price: 450, cost: 150, unit: 'ea', taxable: true },
  { industry: 'General Contracting', category: 'Framing', name: 'Deck Framing (per sqft)', price: 18, cost: 8, unit: 'sqft', taxable: true },
  // Drywall
  { industry: 'General Contracting', category: 'Drywall', name: 'Drywall Install (sqft)', price: 3.5, cost: 1, unit: 'sqft', taxable: true },
  { industry: 'General Contracting', category: 'Drywall', name: 'Drywall Finish Level 4', price: 2.5, cost: 0.8, unit: 'sqft', taxable: true },
  { industry: 'General Contracting', category: 'Drywall', name: 'Drywall Patch (small)', price: 175, cost: 25, unit: 'ea', taxable: true },
  { industry: 'General Contracting', category: 'Drywall', name: 'Drywall Patch (large)', price: 350, cost: 60, unit: 'ea', taxable: true },
  { industry: 'General Contracting', category: 'Drywall', name: 'Texture Match & Spray', price: 2, cost: 0.5, unit: 'sqft', taxable: true },
  // Flooring
  { industry: 'General Contracting', category: 'Flooring', name: 'LVP Install (sqft)', price: 5, cost: 2, unit: 'sqft', taxable: true },
  { industry: 'General Contracting', category: 'Flooring', name: 'Hardwood Install (sqft)', price: 9, cost: 4.5, unit: 'sqft', taxable: true },
  { industry: 'General Contracting', category: 'Flooring', name: 'Tile Install (sqft)', price: 12, cost: 5, unit: 'sqft', taxable: true },
  { industry: 'General Contracting', category: 'Flooring', name: 'Carpet Install (sqft)', price: 4, cost: 1.5, unit: 'sqft', taxable: true },
  { industry: 'General Contracting', category: 'Flooring', name: 'Floor Demo & Prep (sqft)', price: 3, cost: 0.5, unit: 'sqft', taxable: false },
  // Painting
  { industry: 'General Contracting', category: 'Painting', name: 'Interior Paint (sqft)', price: 2.5, cost: 0.75, unit: 'sqft', taxable: true },
  { industry: 'General Contracting', category: 'Painting', name: 'Exterior Paint (sqft)', price: 3.5, cost: 1.2, unit: 'sqft', taxable: true },
  { industry: 'General Contracting', category: 'Painting', name: 'Cabinet Refinish (per door)', price: 85, cost: 20, unit: 'ea', taxable: true },
  { industry: 'General Contracting', category: 'Painting', name: 'Deck Stain (sqft)', price: 3, cost: 0.8, unit: 'sqft', taxable: true },
  // Roofing
  { industry: 'General Contracting', category: 'Roofing', name: 'Shingle Roof (square)', price: 450, cost: 250, unit: 'sq', taxable: true },
  { industry: 'General Contracting', category: 'Roofing', name: 'Roof Repair (leak patch)', price: 395, cost: 80, unit: 'ea', taxable: true },
  { industry: 'General Contracting', category: 'Roofing', name: 'Gutter Install (per linear ft)', price: 12, cost: 4.5, unit: 'lft', taxable: true },
  { industry: 'General Contracting', category: 'Roofing', name: 'Soffit & Fascia Repair (per lft)', price: 18, cost: 6, unit: 'lft', taxable: true },
  // Demo & Misc
  { industry: 'General Contracting', category: 'Demo', name: 'Demo / Haul Away (hour)', price: 95, cost: 15, unit: 'hour', taxable: false },
  { industry: 'General Contracting', category: 'Demo', name: 'Dumpster Rental (10yd)', price: 450, cost: 300, unit: 'ea', taxable: false },
  { industry: 'General Contracting', category: 'Demo', name: 'Dumpster Rental (20yd)', price: 550, cost: 380, unit: 'ea', taxable: false },
  { industry: 'General Contracting', category: 'Permits', name: 'Permit Application Fee', price: 150, cost: 0, unit: 'ea', taxable: false },
  { industry: 'General Contracting', category: 'Permits', name: 'Plan Review / Drafting', price: 350, cost: 0, unit: 'ea', taxable: false },
  { industry: 'General Contracting', category: 'Trim', name: 'Baseboard Install (per lft)', price: 6, cost: 2, unit: 'lft', taxable: true },
];

async function main() {
  console.log(`Seeding pricebook with ${ALL_ITEMS.length} items across all trades...`);

  let created = 0;
  let skipped = 0;

  for (const item of ALL_ITEMS) {
    const exists = await prisma.priceBookItem.findFirst({
      where: { industry: item.industry, category: item.category, name: item.name },
    });
    if (exists) {
      skipped++;
      continue;
    }
    await prisma.priceBookItem.create({ data: item });
    created++;
  }

  console.log(`Done. Created: ${created}, Skipped (already exist): ${skipped}`);
  console.log(`Total items in pricebook: ${await prisma.priceBookItem.count()}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
