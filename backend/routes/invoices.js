/**
 * routes/invoices.js  — Invoice CRUD
  * status: unpaid | paid | overdue | void
   */
   const express          = require('express');
   const router           = express.Router();
   const { PrismaClient } = require('@prisma/client');
   const { requireAuth }  = require('./auth');
   const prisma           = new PrismaClient();

   router.get('/', requireAuth, async (req, res, next) => {
     try {
         const { status } = req.query;
             const where = status ? { status } : {};
                 const invoices = await prisma.invoice.findMany({ where, include: { job: { include: { customer: true } } }, orderBy: { createdAt: 'desc' } });
                     res.json(invoices);
                       } catch (e) { next(e); }
                       });

                       router.get('/:id', requireAuth, async (req, res, next) => {
                         try {
                             const inv = await prisma.invoice.findUnique({ where: { id: Number(req.params.id) }, include: { job: { include: { customer: true } } } });
                                 if (!inv) return res.status(404).json({ error: 'Invoice not found' });
                                     res.json(inv);
                                       } catch (e) { next(e); }
                                       });

                                       router.post('/', requireAuth, async (req, res, next) => {
                                         try {
                                             const { jobId, amount, dueDate, notes } = req.body;
                                                 if (!jobId || amount == null) return res.status(400).json({ error: 'jobId and amount are required' });
                                                     const inv = await prisma.invoice.create({
                                                           data: { jobId: Number(jobId), amount: Number(amount), dueDate: dueDate ? new Date(dueDate) : null, notes },
                                                               });
                                                                   res.status(201).json(inv);
                                                                     } catch (e) { next(e); }
                                                                     });

                                                                     router.patch('/:id', requireAuth, async (req, res, next) => {
                                                                       try {
                                                                           const data = { ...req.body };
                                                                               if (data.amount)  data.amount  = Number(data.amount);
                                                                                   if (data.dueDate) data.dueDate = new Date(data.dueDate);
                                                                                       if (data.status === 'paid' && !data.paidAt) data.paidAt = new Date();
                                                                                           const inv = await prisma.invoice.update({ where: { id: Number(req.params.id) }, data });
                                                                                               res.json(inv);
                                                                                                 } catch (e) { next(e); }
                                                                                                 });

                                                                                                 router.delete('/:id', requireAuth, async (req, res, next) => {
                                                                                                   try {
                                                                                                       await prisma.invoice.delete({ where: { id: Number(req.params.id) } });
                                                                                                           res.json({ success: true });
                                                                                                             } catch (e) { next(e); }
                                                                                                             });
                                                                                                             
                                                                                                             module.exports = router;
                                                                                                             
