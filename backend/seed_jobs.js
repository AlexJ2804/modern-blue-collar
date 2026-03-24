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

const TEAM = [];

// ── Add your customers here ─────────────────────────────────────────────────
// Example format (uncomment and customize):
//
// const CUSTOMERS = [
//   { firstName: 'John', lastName: 'Doe', phone: '555-0001', email: 'john@example.com', address: '123 Main St', city: 'Anytown', state: 'KS', zip: '66001', type: 'residential' },
// ];
//
// Supported types: residential | commercial | industrial

const CUSTOMERS = [];

// ── Add your jobs here ──────────────────────────────────────────────────────
// Jobs reference customers and team members by array index (0-based).
// Example format (uncomment and customize):
//
// const JOBS = [
//   { title: 'Service Call', type: 'General', status: 'pending', priority: 'normal', customerIndex: 0, techIndex: 0, scheduledDate: '2026-04-01', scheduledTime: '09:00', duration: 1.5, notes: '' },
// ];
//
// Supported statuses: pending | scheduled | in-progress | completed | cancelled
// Supported priorities: low | normal | high | urgent

const JOBS = [];

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
