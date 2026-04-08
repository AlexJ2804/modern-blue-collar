/**
 * seed_jobs.js
 * Job/customer/team seed template — no data is pre-populated.
 * Each business must provide their own customers, team members, and jobs.
 *
 * To seed sample data, add entries to the arrays below
 * following the format shown in the examples, then run:
 *   node seed_jobs.js
 *
 * Or add customers, team, and jobs directly via the UI.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const brand = require('../brand.config');

const prisma = new PrismaClient();

// ── Add your team members here ──────────────────────────────────────────────
// Example format (uncomment and customize):
//
// const TEAM = [
//   { email: 'tech@yourcompany.com', firstName: 'First', lastName: 'Last', role: 'technician' },
//   { email: 'dispatch@yourcompany.com', firstName: 'First', lastName: 'Last', role: 'dispatcher' },
// ];
//
// Supported roles: super-admin | admin | technician | dispatcher | office

const TEAM = [
  { email: 'bob@allproplumbinghvac.com',   firstName: 'Bob',    lastName: 'Hiatt',    role: 'admin' },
  { email: 'sara@allproplumbinghvac.com',  firstName: 'Sara',   lastName: 'Hiatt',    role: 'admin' },
  { email: 'mike@allproplumbinghvac.com',  firstName: 'Mike',   lastName: 'Ramos',    role: 'technician' },
  { email: 'jake@allproplumbinghvac.com',  firstName: 'Jake',   lastName: 'Townsend', role: 'technician' },
  { email: 'lisa@allproplumbinghvac.com',  firstName: 'Lisa',   lastName: 'Chen',     role: 'dispatcher' },
];

const CUSTOMERS = [
  { firstName: 'David',    lastName: 'Morrison',  phone: '316-555-0101', email: 'david.morrison@email.com',  address: '2415 N Woodlawn Blvd',  city: 'Wichita', state: 'KS', zip: '67220', type: 'residential' },
  { firstName: 'Karen',    lastName: 'Phillips',  phone: '316-555-0102', email: 'karen.phillips@email.com',  address: '810 E Douglas Ave',      city: 'Wichita', state: 'KS', zip: '67202', type: 'residential' },
  { firstName: 'Tom',      lastName: 'Nguyen',    phone: '316-555-0103', email: 'tom.nguyen@email.com',      address: '4320 W Maple St',        city: 'Wichita', state: 'KS', zip: '67209', type: 'residential' },
  { firstName: 'Rachel',   lastName: 'Gomez',     phone: '316-555-0104', email: 'rachel.gomez@email.com',    address: '1100 S Seneca St',       city: 'Wichita', state: 'KS', zip: '67213', type: 'residential' },
  { firstName: 'Midwest',  lastName: 'Dental Group', phone: '316-555-0201', email: 'office@midwestdental.com', address: '7700 E Kellogg Dr',   city: 'Wichita', state: 'KS', zip: '67207', type: 'commercial' },
  { firstName: 'Sunrise',  lastName: 'Apartments',   phone: '316-555-0202', email: 'mgr@sunriseapts.com',     address: '3200 S Hydraulic Ave', city: 'Wichita', state: 'KS', zip: '67211', type: 'commercial' },
];

const JOBS = [
  { title: 'Water Heater Replacement', type: 'Water Heater', status: 'scheduled',    priority: 'high',   customerIndex: 0, techIndex: 2, scheduledDate: '2026-04-01', scheduledTime: '08:00', duration: 3,   notes: 'Customer reports no hot water. 50-gal tank, gas. Quoted tankless upgrade.' },
  { title: 'Kitchen Drain Backup',     type: 'Drain Cleaning', status: 'scheduled',  priority: 'normal', customerIndex: 1, techIndex: 3, scheduledDate: '2026-04-01', scheduledTime: '10:00', duration: 1.5, notes: 'Slow drain, possibly grease buildup. Bring snake & hydro-jet.' },
  { title: 'AC Tune-Up',               type: 'Tune-Up',        status: 'scheduled',  priority: 'normal', customerIndex: 2, techIndex: 2, scheduledDate: '2026-04-02', scheduledTime: '09:00', duration: 1,   notes: 'Annual spring tune-up. Check refrigerant levels.' },
  { title: 'Furnace Not Igniting',     type: 'Furnace Repair', status: 'pending',    priority: 'urgent', customerIndex: 3, techIndex: 3, scheduledDate: '2026-04-01', scheduledTime: '14:00', duration: 2,   notes: 'Furnace clicks but does not ignite. Likely ignitor or flame sensor.' },
  { title: 'Restroom Fixture Remodel', type: 'Fixture Install', status: 'scheduled', priority: 'normal', customerIndex: 4, techIndex: 2, scheduledDate: '2026-04-03', scheduledTime: '07:00', duration: 6,   notes: '2 toilets + 3 faucets in patient restrooms. Work before office opens.' },
  { title: 'Sewer Line Inspection',    type: 'Sewer Line',     status: 'pending',    priority: 'normal', customerIndex: 5, techIndex: 3, scheduledDate: '2026-04-04', scheduledTime: '08:00', duration: 2,   notes: 'Multiple units reporting slow drains. Camera inspect main line.' },
  { title: 'Toilet Repair',            type: 'Leak Repair',    status: 'completed',  priority: 'low',    customerIndex: 1, techIndex: 2, scheduledDate: '2026-03-25', scheduledTime: '11:00', duration: 1,   notes: 'Running toilet — replaced flapper and fill valve.' },
  { title: 'AC Install – Mini Split',  type: 'AC Install',     status: 'pending',    priority: 'normal', customerIndex: 0, techIndex: 2, scheduledDate: '2026-04-07', scheduledTime: '08:00', duration: 5,   notes: 'Ductless mini-split for garage workshop. Single zone.' },
];

async function main() {
  if (TEAM.length === 0 && CUSTOMERS.length === 0 && JOBS.length === 0) {
    console.log('No seed data to create.');
    console.log('Add your team members, customers, and jobs to the arrays in seed_jobs.js,');
    console.log('or add them directly via the UI.');
    return;
  }

  const defaultPassword = process.env.DEFAULT_PASSWORD || 'changeme123!';
  const hash = await bcrypt.hash(defaultPassword, 10);

  // Create team members
  const techs = [];
  for (const t of TEAM) {
    const existing = await prisma.user.findUnique({ where: { email: t.email } });
    if (existing) { techs.push(existing); continue; }
    techs.push(await prisma.user.create({ data: { ...t, password: hash } }));
  }

  // Create customers
  const custs = [];
  for (const c of CUSTOMERS) {
    const existing = await prisma.customer.findFirst({ where: { email: c.email } });
    if (existing) { custs.push(existing); continue; }
    custs.push(await prisma.customer.create({ data: { ...c, state: c.state || brand.defaultState } }));
  }

  // Create jobs
  let created = 0;
  for (const j of JOBS) {
    const { customerIndex, techIndex, ...jobData } = j;
    if (customerIndex == null || !custs[customerIndex]) continue;
    const exists = await prisma.job.findFirst({
      where: { title: jobData.title, customerId: custs[customerIndex].id },
    });
    if (exists) continue;
    await prisma.job.create({
      data: {
        ...jobData,
        customerId: custs[customerIndex].id,
        technicianId: techIndex != null && techs[techIndex] ? techs[techIndex].id : null,
        tradeType: brand.tradeType,
      },
    });
    created++;
  }

  console.log(`Done. Created ${techs.length} team members, ${custs.length} customers, ${created} jobs.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
