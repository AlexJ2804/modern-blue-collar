/**
 * seed_jobs.js
 * Seed data for David Lies Plumbing Inc — Wichita, KS
 * Family-owned full-service plumbing since 1978.
 *
 * Usage:
 *   node seed_jobs.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const brand = require('../brand.config');

const prisma = new PrismaClient();

// ── Team members ────────────────────────────────────────────────────────────
// Supported roles: super-admin | admin | technician | dispatcher | office

const TEAM = [
  { email: 'evan@davidliesplumbing.com',   firstName: 'Evan',   lastName: 'Lies',     role: 'admin' },
  { email: 'office@davidliesplumbing.com',  firstName: 'Office', lastName: 'Manager',  role: 'dispatcher' },
];

// ── Customers ───────────────────────────────────────────────────────────────
// Supported types: residential | commercial | industrial

const CUSTOMERS = [
  { firstName: 'Mark',     lastName: 'Henderson', phone: '316-555-0101', email: 'mark.henderson@email.com', address: '2840 N Rock Rd',      city: 'Wichita',    state: 'KS', zip: '67226', type: 'residential' },
  { firstName: 'Susan',    lastName: 'Park',      phone: '316-555-0102', email: 'susan.park@email.com',     address: '615 W Douglas Ave',    city: 'Wichita',    state: 'KS', zip: '67213', type: 'residential' },
  { firstName: 'Heritage', lastName: 'Baptist Church', phone: '316-555-0201', email: 'facilities@hbc.org',  address: '1500 N Meridian Ave',  city: 'Wichita',    state: 'KS', zip: '67203', type: 'commercial' },
  { firstName: 'Janet',    lastName: 'Collins',   phone: '316-555-0103', email: 'janet.collins@email.com',  address: '4100 E 21st St',       city: 'Wichita',    state: 'KS', zip: '67208', type: 'residential' },
  { firstName: 'Prairie',  lastName: 'Village Apartments', phone: '316-555-0202', email: 'mgr@prairievillage.com', address: '800 S Webb Rd', city: 'Wichita',    state: 'KS', zip: '67207', type: 'commercial' },
];

// ── Jobs ────────────────────────────────────────────────────────────────────
// Jobs reference customers and team members by array index (0-based).

const JOBS = [
  { title: 'Water Heater Replacement',  type: 'Water Heater',    status: 'scheduled',  priority: 'high',   customerIndex: 0, techIndex: null, scheduledDate: '2026-04-07', scheduledTime: '08:00', duration: 3,   notes: 'Gas water heater leaking from bottom. Customer wants same-day if possible.' },
  { title: 'Kitchen Drain Clog',         type: 'Drain Cleaning',  status: 'scheduled',  priority: 'normal', customerIndex: 1, techIndex: null, scheduledDate: '2026-04-07', scheduledTime: '10:30', duration: 1.5, notes: 'Standing water in kitchen sink. Snake first, hydro-jet if needed.' },
  { title: 'Backflow Test – Annual',     type: 'Inspection',      status: 'pending',    priority: 'normal', customerIndex: 2, techIndex: null, scheduledDate: '2026-04-08', scheduledTime: '09:00', duration: 1,   notes: 'Annual backflow preventer certification.' },
  { title: 'Toilet Running Constantly',  type: 'Fixture Install', status: 'scheduled',  priority: 'low',    customerIndex: 3, techIndex: null, scheduledDate: '2026-04-08', scheduledTime: '13:00', duration: 1,   notes: 'Upstairs guest bath. Likely fill valve or flapper.' },
  { title: 'Sewer Camera Inspection',    type: 'Sewer Line',      status: 'pending',    priority: 'normal', customerIndex: 4, techIndex: null, scheduledDate: '2026-04-09', scheduledTime: '08:00', duration: 2,   notes: 'Building A — multiple units slow drains. Camera main line.' },
  { title: 'Water Softener Install',     type: 'Troubleshooting', status: 'pending',    priority: 'normal', customerIndex: 0, techIndex: null, scheduledDate: '2026-04-10', scheduledTime: '08:00', duration: 3,   notes: 'New construction. Customer chose unit from showroom.' },
];

async function main() {
  if (TEAM.length === 0 && CUSTOMERS.length === 0 && JOBS.length === 0) {
    console.log('No seed data to create.');
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
