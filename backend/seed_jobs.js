/**
 * seed_jobs.js
 * Seeds 12 diverse test jobs across trades and statuses,
 * along with 4 test customers and 3 technicians.
 *
 * Usage:
 *   node seed_jobs.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const brand = require('../brand.config');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test customers, technicians, and jobs...');

  // ── Create test technicians ──────────────────────────────────────────────
  const hash = await bcrypt.hash('test1234!', 10);
  const techData = [
    { email: 'eli@example.com',   firstName: 'Eli',   lastName: 'Martinez', role: 'technician', password: hash },
    { email: 'sarah@example.com', firstName: 'Sarah', lastName: 'Chen',     role: 'technician', password: hash },
    { email: 'mike@example.com',  firstName: 'Mike',  lastName: 'Johnson',  role: 'dispatcher', password: hash },
  ];

  const techs = [];
  for (const t of techData) {
    const existing = await prisma.user.findUnique({ where: { email: t.email } });
    if (existing) { techs.push(existing); continue; }
    techs.push(await prisma.user.create({ data: t }));
  }

  // ── Create test customers ────────────────────────────────────────────────
  const custData = [
    { firstName: 'James',    lastName: 'Wilson',    phone: '913-555-0101', email: 'james@example.com',    address: '123 Oak St',     city: 'Overland Park', state: brand.defaultState, zip: '66210', type: 'residential' },
    { firstName: 'Patricia', lastName: 'Garcia',    phone: '913-555-0102', email: 'patricia@example.com', address: '456 Elm Ave',    city: 'Lenexa',        state: brand.defaultState, zip: '66215', type: 'residential' },
    { firstName: 'Robert',   lastName: 'Anderson',  phone: '913-555-0103', email: 'robert@example.com',   address: '789 Main St',    city: 'Olathe',        state: brand.defaultState, zip: '66061', type: 'commercial' },
    { firstName: 'Linda',    lastName: 'Thompson',  phone: '913-555-0104', email: 'linda@example.com',    address: '321 Walnut Dr',  city: 'Shawnee',       state: brand.defaultState, zip: '66216', type: 'residential' },
  ];

  const custs = [];
  for (const c of custData) {
    const existing = await prisma.customer.findFirst({ where: { email: c.email } });
    if (existing) { custs.push(existing); continue; }
    custs.push(await prisma.customer.create({ data: c }));
  }

  // ── Create 12 diverse test jobs ──────────────────────────────────────────
  const today = new Date();
  const dateStr = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const jobData = [
    { title: 'Panel Upgrade 200A',         type: 'Panel Upgrade',     tradeType: 'electrical',    status: 'pending',     priority: 'high',   customerId: custs[0].id, technicianId: techs[0].id, scheduledDate: dateStr(0),  scheduledTime: '08:00', duration: 4, notes: 'Older home, knob and tube in attic' },
    { title: 'Kitchen Faucet Replace',      type: 'Faucet Install',    tradeType: 'plumbing',      status: 'scheduled',   priority: 'normal', customerId: custs[1].id, technicianId: techs[1].id, scheduledDate: dateStr(0),  scheduledTime: '09:00', duration: 1.5, notes: 'Moen faucet customer purchased' },
    { title: 'AC Tune-Up',                  type: 'AC Tune-Up',        tradeType: 'hvac',           status: 'scheduled',   priority: 'normal', customerId: custs[2].id, technicianId: techs[0].id, scheduledDate: dateStr(1),  scheduledTime: '10:00', duration: 1, notes: 'Annual spring maintenance' },
    { title: 'Drywall Patch - Bathroom',    type: 'Drywall Repair',    tradeType: 'contracting',   status: 'in-progress', priority: 'normal', customerId: custs[3].id, technicianId: techs[1].id, scheduledDate: dateStr(-1), scheduledTime: '08:00', duration: 3, notes: 'Water damage behind toilet' },
    { title: 'EV Charger Install',          type: 'EV Charger',        tradeType: 'electrical',    status: 'pending',     priority: 'normal', customerId: custs[1].id, technicianId: null,        scheduledDate: dateStr(3),  scheduledTime: '13:00', duration: 3, notes: 'Tesla Wall Connector, 60A circuit needed' },
    { title: 'Water Heater Replace 50g',    type: 'Water Heater',      tradeType: 'plumbing',      status: 'completed',   priority: 'urgent', customerId: custs[0].id, technicianId: techs[0].id, scheduledDate: dateStr(-3), scheduledTime: '07:00', duration: 3, notes: 'Emergency - no hot water' },
    { title: 'Furnace Tune-Up',             type: 'Furnace Tune-Up',   tradeType: 'hvac',           status: 'completed',   priority: 'low',    customerId: custs[3].id, technicianId: techs[1].id, scheduledDate: dateStr(-5), scheduledTime: '14:00', duration: 1, notes: 'Pre-winter maintenance' },
    { title: 'Roof Leak Repair',            type: 'Roof Repair',       tradeType: 'contracting',   status: 'scheduled',   priority: 'high',   customerId: custs[2].id, technicianId: techs[0].id, scheduledDate: dateStr(2),  scheduledTime: '08:00', duration: 4, notes: 'Active leak near chimney flashing' },
    { title: 'Whole-House Surge Protector', type: 'Surge Protector',   tradeType: 'electrical',    status: 'scheduled',   priority: 'normal', customerId: custs[3].id, technicianId: techs[0].id, scheduledDate: dateStr(4),  scheduledTime: '11:00', duration: 1.5, notes: 'Install at main panel' },
    { title: 'Drain Cleaning - Kitchen',    type: 'Drain Cleaning',    tradeType: 'plumbing',      status: 'cancelled',   priority: 'normal', customerId: custs[2].id, technicianId: techs[1].id, scheduledDate: dateStr(-2), scheduledTime: '15:00', duration: 1, notes: 'Customer fixed it themselves' },
    { title: 'Mini-Split Install',          type: 'Mini-Split',        tradeType: 'hvac',           status: 'pending',     priority: 'normal', customerId: custs[0].id, technicianId: null,        scheduledDate: dateStr(7),  scheduledTime: '08:00', duration: 6, notes: 'Sunroom addition, single zone' },
    { title: 'LVP Flooring Install',        type: 'Flooring Install',  tradeType: 'contracting',   status: 'scheduled',   priority: 'normal', customerId: custs[1].id, technicianId: techs[1].id, scheduledDate: dateStr(5),  scheduledTime: '07:00', duration: 8, notes: '500 sqft living room, demo old carpet' },
  ];

  let created = 0;
  for (const j of jobData) {
    const exists = await prisma.job.findFirst({
      where: { title: j.title, customerId: j.customerId },
    });
    if (exists) continue;
    await prisma.job.create({ data: j });
    created++;
  }

  console.log(`Done. Created ${created} jobs, ${custs.length} customers, ${techs.length} technicians.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
