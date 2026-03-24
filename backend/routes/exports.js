/**
 * routes/exports.js  — CSV data exports
  * GET /api/exports/customers   → customers.csv
   * GET /api/exports/jobs        → jobs.csv
    * GET /api/exports/invoices    → invoices.csv
     */
     const express          = require('express');
     const router           = express.Router();
     const { PrismaClient } = require('@prisma/client');
     const { requireAuth, requireRole } = require('./auth');
     const brand            = require('../../brand.config');

     const prisma = new PrismaClient();

     function toCSV(rows, columns) {
       const header = columns.join(',');
         const lines  = rows.map(r => columns.map(c => {
             const v = r[c] == null ? '' : String(r[c]).replace(/"/g, '""');
                 return `"${v}"`;
                   }).join(','));
                     return [header, ...lines].join('\n');
                     }

                     router.get('/customers', requireAuth, requireRole('super-admin', 'admin'), async (_req, res, next) => {
                       try {
                           const rows = await prisma.customer.findMany({ orderBy: { lastName: 'asc' } });
                               const csv  = toCSV(rows, ['id', 'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zip', 'type', 'createdAt']);
                                   res.setHeader('Content-Type', 'text/csv');
                                       res.setHeader('Content-Disposition', `attachment; filename="${brand.companyName.replace(/\s+/g, '_')}_customers.csv"`);
                                           res.send(csv);
                                             } catch (e) { next(e); }
                                             });

                                             router.get('/jobs', requireAuth, requireRole('super-admin', 'admin'), async (_req, res, next) => {
                                               try {
                                                   const rows = await prisma.job.findMany({
                                                         include: { customer: true, technician: true },
                                                               orderBy: { createdAt: 'desc' },
                                                                   });
                                                                       const flat = rows.map(j => ({
                                                                             id: j.id, title: j.title, status: j.status, priority: j.priority, type: j.type, tradeType: j.tradeType,
                                                                                   customerName: j.customer ? `${j.customer.firstName} ${j.customer.lastName}` : '',
                                                                                         technicianName: j.technician ? `${j.technician.firstName} ${j.technician.lastName}` : '',
                                                                                               scheduledDate: j.scheduledDate, scheduledTime: j.scheduledTime,
                                                                                                     completedAt: j.completedAt, createdAt: j.createdAt,
                                                                                                         }));
                                                                                                             const csv = toCSV(flat, ['id', 'title', 'status', 'priority', 'type', 'tradeType', 'customerName', 'technicianName', 'scheduledDate', 'scheduledTime', 'completedAt', 'createdAt']);
                                                                                                                 res.setHeader('Content-Type', 'text/csv');
                                                                                                                     res.setHeader('Content-Disposition', `attachment; filename="${brand.companyName.replace(/\s+/g, '_')}_jobs.csv"`);
                                                                                                                         res.send(csv);
                                                                                                                           } catch (e) { next(e); }
                                                                                                                           });
                                                                                                                           
                                                                                                                           router.get('/invoices', requireAuth, requireRole('super-admin', 'admin'), async (_req, res, next) => {
                                                                                                                             try {
                                                                                                                                 const rows = await prisma.invoice.findMany({ include: { job: { include: { customer: true } } }, orderBy: { createdAt: 'desc' } });
                                                                                                                                     const flat = rows.map(i => ({
                                                                                                                                           id: i.id, amount: i.amount, status: i.status, dueDate: i.dueDate, paidAt: i.paidAt,
                                                                                                                                                 jobTitle: i.job?.title, customerName: i.job?.customer ? `${i.job.customer.firstName} ${i.job.customer.lastName}` : '',
                                                                                                                                                       createdAt: i.createdAt,
                                                                                                                                                           }));
                                                                                                                                                               const csv = toCSV(flat, ['id', 'amount', 'status', 'dueDate', 'paidAt', 'jobTitle', 'customerName', 'createdAt']);
                                                                                                                                                                   res.setHeader('Content-Type', 'text/csv');
                                                                                                                                                                       res.setHeader('Content-Disposition', `attachment; filename="${brand.companyName.replace(/\s+/g, '_')}_invoices.csv"`);
                                                                                                                                                                           res.send(csv);
                                                                                                                                                                             } catch (e) { next(e); }
                                                                                                                                                                             });
                                                                                                                                                                             
                                                                                                                                                                             module.exports = router;
                                                                                                                                                                             
