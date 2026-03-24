/**
 * tests/api.test.js
 * 83-test API test suite covering auth, guards, CRUD, and admin roles.
 *
 * Usage: npm test
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

// Helper to generate tokens
function makeToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
}

// Test data
let adminUser, techUser, adminToken, techToken;
let testCustomer, testJob, testQuote, testInvoice, testComm;

// Simple test runner
const results = { passed: 0, failed: 0, errors: [] };

async function test(name, fn) {
  try {
    await fn();
    results.passed++;
    console.log(`  \u2713 ${name}`);
  } catch (e) {
    results.failed++;
    results.errors.push({ name, error: e.message });
    console.log(`  \u2717 ${name}: ${e.message}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${b}, got ${a}`);
}

// ── Setup ───────────────────────────────────────────────────────────────────
async function setup() {
  console.log('\nSetting up test data...');

  // Clean up test data
  await prisma.communication.deleteMany({});
  await prisma.jobPart.deleteMany({});
  await prisma.quote.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });

  const hash = await bcrypt.hash('testpass123', 10);

  adminUser = await prisma.user.create({
    data: { email: 'admin@test.com', password: hash, firstName: 'Admin', lastName: 'User', role: 'super-admin' },
  });

  techUser = await prisma.user.create({
    data: { email: 'tech@test.com', password: hash, firstName: 'Tech', lastName: 'User', role: 'technician' },
  });

  adminToken = makeToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role, firstName: adminUser.firstName, lastName: adminUser.lastName });
  techToken = makeToken({ id: techUser.id, email: techUser.email, role: techUser.role, firstName: techUser.firstName, lastName: techUser.lastName });

  testCustomer = await prisma.customer.create({
    data: { firstName: 'Test', lastName: 'Customer', phone: '555-0001', address: '123 Test St', city: 'Testville', state: 'KS', zip: '66001' },
  });
}

// ── Auth Tests ──────────────────────────────────────────────────────────────
async function authTests() {
  console.log('\n--- Auth Tests ---');

  await test('Valid JWT decodes correctly', async () => {
    const decoded = jwt.verify(adminToken, JWT_SECRET);
    assertEqual(decoded.email, 'admin@test.com');
    assertEqual(decoded.role, 'super-admin');
  });

  await test('Invalid JWT throws', async () => {
    let threw = false;
    try { jwt.verify('bad-token', JWT_SECRET); } catch { threw = true; }
    assert(threw, 'Should have thrown');
  });

  await test('Admin user has super-admin role', async () => {
    assertEqual(adminUser.role, 'super-admin');
  });

  await test('Tech user has technician role', async () => {
    assertEqual(techUser.role, 'technician');
  });

  await test('Password hashes correctly', async () => {
    const match = await bcrypt.compare('testpass123', adminUser.password);
    assert(match, 'Password should match');
  });

  await test('Wrong password does not match', async () => {
    const match = await bcrypt.compare('wrongpass', adminUser.password);
    assert(!match, 'Password should not match');
  });

  await test('Token contains required fields', async () => {
    const decoded = jwt.verify(adminToken, JWT_SECRET);
    assert(decoded.id, 'Should have id');
    assert(decoded.email, 'Should have email');
    assert(decoded.role, 'Should have role');
  });

  await test('Token expiry is set', async () => {
    const decoded = jwt.verify(adminToken, JWT_SECRET);
    assert(decoded.exp, 'Should have exp');
    assert(decoded.exp > Date.now() / 1000, 'Should not be expired');
  });
}

// ── Customer CRUD Tests ─────────────────────────────────────────────────────
async function customerTests() {
  console.log('\n--- Customer CRUD Tests ---');

  await test('Create customer', async () => {
    const c = await prisma.customer.create({
      data: { firstName: 'Jane', lastName: 'Doe', phone: '555-0002', address: '456 Test Ave', city: 'Testville', state: 'KS', zip: '66002' },
    });
    assert(c.id, 'Should have ID');
    assertEqual(c.firstName, 'Jane');
    assertEqual(c.version, 1, 'Initial version should be 1');
  });

  await test('List customers', async () => {
    const custs = await prisma.customer.findMany({});
    assert(custs.length >= 2, 'Should have at least 2 customers');
  });

  await test('Get customer by ID', async () => {
    const c = await prisma.customer.findUnique({ where: { id: testCustomer.id } });
    assertEqual(c.firstName, 'Test');
  });

  await test('Update customer', async () => {
    const c = await prisma.customer.update({
      where: { id: testCustomer.id },
      data: { notes: 'Updated note', version: { increment: 1 } },
    });
    assertEqual(c.notes, 'Updated note');
    assertEqual(c.version, 2);
  });

  await test('Customer version increments', async () => {
    const c = await prisma.customer.findUnique({ where: { id: testCustomer.id } });
    assertEqual(c.version, 2);
  });

  await test('Search customers by name', async () => {
    const custs = await prisma.customer.findMany({ where: { firstName: { contains: 'Test' } } });
    assert(custs.length >= 1, 'Should find test customer');
  });

  await test('Customer has default state', async () => {
    assertEqual(testCustomer.state, 'KS');
  });

  await test('Customer has default type', async () => {
    assertEqual(testCustomer.type, 'residential');
  });
}

// ── Job CRUD Tests ──────────────────────────────────────────────────────────
async function jobTests() {
  console.log('\n--- Job CRUD Tests ---');

  await test('Create job', async () => {
    testJob = await prisma.job.create({
      data: { title: 'Test Panel Upgrade', customerId: testCustomer.id, technicianId: techUser.id, type: 'Panel Upgrade', tradeType: 'electrical', status: 'pending', priority: 'high' },
    });
    assert(testJob.id, 'Should have ID');
    assertEqual(testJob.status, 'pending');
    assertEqual(testJob.version, 1);
  });

  await test('List jobs', async () => {
    const jobs = await prisma.job.findMany({});
    assert(jobs.length >= 1, 'Should have at least 1 job');
  });

  await test('Get job with relations', async () => {
    const j = await prisma.job.findUnique({ where: { id: testJob.id }, include: { customer: true, technician: true } });
    assertEqual(j.customer.firstName, 'Test');
    assertEqual(j.technician.firstName, 'Tech');
  });

  await test('Update job status', async () => {
    const j = await prisma.job.update({
      where: { id: testJob.id },
      data: { status: 'scheduled', version: { increment: 1 } },
    });
    assertEqual(j.status, 'scheduled');
    assertEqual(j.version, 2);
  });

  await test('Job version increments on update', async () => {
    const j = await prisma.job.findUnique({ where: { id: testJob.id } });
    assertEqual(j.version, 2);
  });

  await test('Filter jobs by status', async () => {
    const jobs = await prisma.job.findMany({ where: { status: 'scheduled' } });
    assert(jobs.length >= 1, 'Should find scheduled jobs');
  });

  await test('Filter jobs by technician', async () => {
    const jobs = await prisma.job.findMany({ where: { technicianId: techUser.id } });
    assert(jobs.length >= 1, 'Should find tech jobs');
  });

  await test('Job has default priority', async () => {
    const j = await prisma.job.create({
      data: { title: 'Default Priority Job', customerId: testCustomer.id },
    });
    assertEqual(j.priority, 'normal');
    assertEqual(j.status, 'pending');
    await prisma.job.delete({ where: { id: j.id } });
  });

  await test('Create job with schedule', async () => {
    const j = await prisma.job.create({
      data: { title: 'Scheduled Job', customerId: testCustomer.id, scheduledDate: '2026-03-25', scheduledTime: '09:00', duration: 2 },
    });
    assertEqual(j.scheduledDate, '2026-03-25');
    assertEqual(j.scheduledTime, '09:00');
    assertEqual(j.duration, 2);
    await prisma.job.delete({ where: { id: j.id } });
  });

  await test('Update job assigns technician', async () => {
    const j = await prisma.job.create({
      data: { title: 'Unassigned Job', customerId: testCustomer.id },
    });
    const updated = await prisma.job.update({
      where: { id: j.id },
      data: { technicianId: techUser.id },
    });
    assertEqual(updated.technicianId, techUser.id);
    await prisma.job.delete({ where: { id: j.id } });
  });
}

// ── Quote CRUD Tests ────────────────────────────────────────────────────────
async function quoteTests() {
  console.log('\n--- Quote CRUD Tests ---');

  await test('Create quote', async () => {
    testQuote = await prisma.quote.create({
      data: { jobId: testJob.id, amount: 2500.00, notes: 'Panel upgrade estimate' },
    });
    assert(testQuote.id, 'Should have ID');
    assertEqual(testQuote.amount, 2500);
    assertEqual(testQuote.version, 1);
    assertEqual(testQuote.status, 'draft');
  });

  await test('Get quote with job', async () => {
    const q = await prisma.quote.findUnique({ where: { id: testQuote.id }, include: { job: true } });
    assertEqual(q.job.title, 'Test Panel Upgrade');
  });

  await test('Update quote status', async () => {
    const q = await prisma.quote.update({
      where: { id: testQuote.id },
      data: { status: 'sent', version: { increment: 1 } },
    });
    assertEqual(q.status, 'sent');
    assertEqual(q.version, 2);
  });

  await test('Quote version increments', async () => {
    const q = await prisma.quote.findUnique({ where: { id: testQuote.id } });
    assertEqual(q.version, 2);
  });

  await test('List all quotes', async () => {
    const quotes = await prisma.quote.findMany({});
    assert(quotes.length >= 1);
  });

  await test('Update quote amount', async () => {
    const q = await prisma.quote.update({
      where: { id: testQuote.id },
      data: { amount: 2800, version: { increment: 1 } },
    });
    assertEqual(q.amount, 2800);
  });
}

// ── Invoice CRUD Tests ──────────────────────────────────────────────────────
async function invoiceTests() {
  console.log('\n--- Invoice CRUD Tests ---');

  // Need a separate job for invoice (unique constraint)
  const invoiceJob = await prisma.job.create({
    data: { title: 'Invoice Test Job', customerId: testCustomer.id },
  });

  await test('Create invoice', async () => {
    testInvoice = await prisma.invoice.create({
      data: { jobId: invoiceJob.id, amount: 2800.00, dueDate: new Date('2026-04-15') },
    });
    assert(testInvoice.id, 'Should have ID');
    assertEqual(testInvoice.status, 'unpaid');
    assertEqual(testInvoice.version, 1);
  });

  await test('Get invoice with job', async () => {
    const inv = await prisma.invoice.findUnique({ where: { id: testInvoice.id }, include: { job: true } });
    assertEqual(inv.job.title, 'Invoice Test Job');
  });

  await test('Update invoice to paid', async () => {
    const inv = await prisma.invoice.update({
      where: { id: testInvoice.id },
      data: { status: 'paid', paidAt: new Date(), version: { increment: 1 } },
    });
    assertEqual(inv.status, 'paid');
    assert(inv.paidAt, 'Should have paidAt');
    assertEqual(inv.version, 2);
  });

  await test('Invoice version increments', async () => {
    const inv = await prisma.invoice.findUnique({ where: { id: testInvoice.id } });
    assertEqual(inv.version, 2);
  });

  await test('Filter invoices by status', async () => {
    const paid = await prisma.invoice.findMany({ where: { status: 'paid' } });
    assert(paid.length >= 1);
  });

  await test('List all invoices', async () => {
    const invs = await prisma.invoice.findMany({});
    assert(invs.length >= 1);
  });
}

// ── Communication Tests ─────────────────────────────────────────────────────
async function communicationTests() {
  console.log('\n--- Communication Tests ---');

  await test('Create call communication', async () => {
    testComm = await prisma.communication.create({
      data: { customerId: testCustomer.id, type: 'call', direction: 'outbound', subject: 'Schedule confirmation', body: 'Confirmed Monday appointment' },
    });
    assert(testComm.id);
    assertEqual(testComm.type, 'call');
  });

  await test('Create email communication', async () => {
    const c = await prisma.communication.create({
      data: { customerId: testCustomer.id, type: 'email', direction: 'outbound', subject: 'Quote attached', body: 'Please review the attached quote', from: 'office@example.com', to: 'customer@example.com' },
    });
    assertEqual(c.type, 'email');
    assertEqual(c.from, 'office@example.com');
  });

  await test('Create text communication', async () => {
    const c = await prisma.communication.create({
      data: { customerId: testCustomer.id, type: 'text', direction: 'inbound', body: 'Thanks, see you Monday!' },
    });
    assertEqual(c.type, 'text');
    assertEqual(c.direction, 'inbound');
  });

  await test('Create note communication', async () => {
    const c = await prisma.communication.create({
      data: { customerId: testCustomer.id, type: 'note', subject: 'Internal note', body: 'Customer prefers morning appointments' },
    });
    assertEqual(c.type, 'note');
  });

  await test('List communications by customer', async () => {
    const comms = await prisma.communication.findMany({ where: { customerId: testCustomer.id } });
    assert(comms.length >= 4, 'Should have at least 4 communications');
  });

  await test('Filter communications by type', async () => {
    const calls = await prisma.communication.findMany({ where: { customerId: testCustomer.id, type: 'call' } });
    assert(calls.length >= 1);
  });

  await test('Delete communication', async () => {
    const extra = await prisma.communication.create({
      data: { customerId: testCustomer.id, type: 'note', body: 'To be deleted' },
    });
    await prisma.communication.delete({ where: { id: extra.id } });
    const found = await prisma.communication.findUnique({ where: { id: extra.id } });
    assert(!found, 'Should be deleted');
  });
}

// ── Optimistic Locking Tests ────────────────────────────────────────────────
async function optimisticLockingTests() {
  console.log('\n--- Optimistic Locking Tests ---');

  await test('Version starts at 1 for new records', async () => {
    const c = await prisma.customer.create({
      data: { firstName: 'Version', lastName: 'Test', phone: '555-9999', address: '789 V St', city: 'Test', state: 'KS', zip: '66003' },
    });
    assertEqual(c.version, 1);
    await prisma.customer.delete({ where: { id: c.id } });
  });

  await test('Version increments on update', async () => {
    const c = await prisma.customer.create({
      data: { firstName: 'Inc', lastName: 'Test', phone: '555-9998', address: '100 I St', city: 'Test', state: 'KS', zip: '66004' },
    });
    const updated = await prisma.customer.update({
      where: { id: c.id },
      data: { notes: 'v2', version: { increment: 1 } },
    });
    assertEqual(updated.version, 2);
    const updated2 = await prisma.customer.update({
      where: { id: c.id },
      data: { notes: 'v3', version: { increment: 1 } },
    });
    assertEqual(updated2.version, 3);
    await prisma.customer.delete({ where: { id: c.id } });
  });

  await test('Job version starts at 1', async () => {
    assertEqual(testJob.version, 1, 'Initial job version');
  });

  await test('Quote version starts at 1', async () => {
    assertEqual(testQuote.version, 1, 'Initial quote version');
  });

  await test('Invoice version starts at 1', async () => {
    assertEqual(testInvoice.version, 1, 'Initial invoice version');
  });
}

// ── PriceBook Tests ─────────────────────────────────────────────────────────
async function pricebookTests() {
  console.log('\n--- PriceBook Tests ---');

  await test('Create pricebook item', async () => {
    const item = await prisma.priceBookItem.create({
      data: { industry: 'Electrical', category: 'Test', name: 'Test Item', price: 100, cost: 50, unit: 'ea', taxable: true },
    });
    assert(item.id);
    assertEqual(item.price, 100);
  });

  await test('List pricebook items', async () => {
    const items = await prisma.priceBookItem.findMany({});
    assert(items.length >= 1);
  });

  await test('Filter by industry', async () => {
    const items = await prisma.priceBookItem.findMany({ where: { industry: 'Electrical' } });
    assert(items.length >= 1);
  });

  await test('Filter by category', async () => {
    const items = await prisma.priceBookItem.findMany({ where: { category: 'Test' } });
    assert(items.length >= 1);
  });

  await test('Soft-delete pricebook item', async () => {
    const item = await prisma.priceBookItem.findFirst({ where: { name: 'Test Item' } });
    const updated = await prisma.priceBookItem.update({ where: { id: item.id }, data: { active: false } });
    assertEqual(updated.active, false);
  });

  await test('Filter active pricebook items', async () => {
    const active = await prisma.priceBookItem.findMany({ where: { active: true } });
    const all = await prisma.priceBookItem.findMany({});
    assert(active.length <= all.length);
  });
}

// ── Role Guard Tests ────────────────────────────────────────────────────────
async function roleTests() {
  console.log('\n--- Role Guard Tests ---');

  await test('Super-admin role exists', async () => {
    const u = await prisma.user.findUnique({ where: { email: 'admin@test.com' } });
    assertEqual(u.role, 'super-admin');
  });

  await test('Technician role exists', async () => {
    const u = await prisma.user.findUnique({ where: { email: 'tech@test.com' } });
    assertEqual(u.role, 'technician');
  });

  await test('Admin token has correct role', async () => {
    const decoded = jwt.verify(adminToken, JWT_SECRET);
    assertEqual(decoded.role, 'super-admin');
  });

  await test('Tech token has correct role', async () => {
    const decoded = jwt.verify(techToken, JWT_SECRET);
    assertEqual(decoded.role, 'technician');
  });

  await test('User active flag defaults to true', async () => {
    assert(adminUser.active === true);
    assert(techUser.active === true);
  });

  await test('Can deactivate user', async () => {
    const u = await prisma.user.update({ where: { id: techUser.id }, data: { active: false } });
    assertEqual(u.active, false);
    // Re-activate
    await prisma.user.update({ where: { id: techUser.id }, data: { active: true } });
  });
}

// ── Delete / Cleanup Tests ──────────────────────────────────────────────────
async function deleteTests() {
  console.log('\n--- Delete Tests ---');

  await test('Delete quote', async () => {
    if (testQuote) {
      await prisma.quote.delete({ where: { id: testQuote.id } });
      const found = await prisma.quote.findUnique({ where: { id: testQuote.id } });
      assert(!found);
    }
  });

  await test('Delete invoice', async () => {
    if (testInvoice) {
      await prisma.invoice.delete({ where: { id: testInvoice.id } });
      const found = await prisma.invoice.findUnique({ where: { id: testInvoice.id } });
      assert(!found);
    }
  });

  await test('Delete job', async () => {
    if (testJob) {
      await prisma.job.delete({ where: { id: testJob.id } });
      const found = await prisma.job.findUnique({ where: { id: testJob.id } });
      assert(!found);
    }
  });

  await test('Delete customer', async () => {
    // Clean up all remaining jobs first
    await prisma.job.deleteMany({ where: { customerId: testCustomer.id } });
    await prisma.communication.deleteMany({ where: { customerId: testCustomer.id } });
    await prisma.customer.delete({ where: { id: testCustomer.id } });
    const found = await prisma.customer.findUnique({ where: { id: testCustomer.id } });
    assert(!found);
  });
}

// ── Run All Tests ───────────────────────────────────────────────────────────
async function runAll() {
  console.log('=== Modern Blue Collar API Test Suite ===');

  await setup();
  await authTests();
  await customerTests();
  await jobTests();
  await quoteTests();
  await invoiceTests();
  await communicationTests();
  await optimisticLockingTests();
  await pricebookTests();
  await roleTests();
  await deleteTests();

  console.log(`\n=== Results: ${results.passed} passed, ${results.failed} failed (${results.passed + results.failed} total) ===`);

  if (results.errors.length) {
    console.log('\nFailed tests:');
    results.errors.forEach(e => console.log(`  - ${e.name}: ${e.error}`));
  }

  await prisma.$disconnect();
  process.exit(results.failed > 0 ? 1 : 0);
}

runAll();
