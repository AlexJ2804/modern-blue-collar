/**
 * routes/pricebook.js
  * PriceBook CRUD. Filters by brand.industryLabel by default.
   */

   const express           = require('express');
   const router            = express.Router();
   const { PrismaClient }  = require('@prisma/client');
   const { requireAuth }   = require('./auth');
   const brand             = require('../../brand.config');

   const prisma = new PrismaClient();

   // GET /api/pricebook — filtered to current trade industry by default
   router.get('/', requireAuth, async (req, res, next) => {
     try {
         const { category, search, industry, active } = req.query;
             const where = {
                   industry: industry || brand.industryLabel,
                         active:   active === 'false' ? false : true,
                             };
                                 if (category) where.category = category;
                                     if (search)   where.name = { contains: search, mode: 'insensitive' };

                                         const items = await prisma.priceBookItem.findMany({
                                               where,
                                                     orderBy: [{ category: 'asc' }, { name: 'asc' }],
                                                         });
                                                             res.json({ industry: where.industry, tradeType: brand.tradeType, items });
                                                               } catch (err) { next(err); }
                                                               });

                                                               // GET /api/pricebook/:id
                                                               router.get('/:id', requireAuth, async (req, res, next) => {
                                                                 try {
                                                                     const item = await prisma.priceBookItem.findUnique({ where: { id: Number(req.params.id) } });
                                                                         if (!item) return res.status(404).json({ error: 'PriceBook item not found' });
                                                                             res.json(item);
                                                                               } catch (err) { next(err); }
                                                                               });

                                                                               // POST /api/pricebook
                                                                               router.post('/', requireAuth, async (req, res, next) => {
                                                                                 try {
                                                                                     const { category, name, price, cost, taxable, unit, taskCode, subcategory, description } = req.body;
                                                                                         if (!category || !name) return res.status(400).json({ error: 'category and name are required' });
                                                                                             const item = await prisma.priceBookItem.create({
                                                                                                   data: {
                                                                                                           industry: req.body.industry || brand.industryLabel,
                                                                                                                   category, subcategory, name, description,
                                                                                                                           price: price || 0, cost: cost || 0,
                                                                                                                                   taxable: !!taxable, unit, taskCode,
                                                                                                                                         },
                                                                                                                                             });
                                                                                                                                                 res.status(201).json(item);
                                                                                                                                                   } catch (err) { next(err); }
                                                                                                                                                   });
                                                                                                                                                   
                                                                                                                                                   // PATCH /api/pricebook/:id
                                                                                                                                                   router.patch('/:id', requireAuth, async (req, res, next) => {
                                                                                                                                                     try {
                                                                                                                                                         const item = await prisma.priceBookItem.update({
                                                                                                                                                               where: { id: Number(req.params.id) },
                                                                                                                                                                     data:  req.body,
                                                                                                                                                                         });
                                                                                                                                                                             res.json(item);
                                                                                                                                                                               } catch (err) { next(err); }
                                                                                                                                                                               });
                                                                                                                                                                               
                                                                                                                                                                               // DELETE /api/pricebook/:id
                                                                                                                                                                               router.delete('/:id', requireAuth, async (req, res, next) => {
                                                                                                                                                                                 try {
                                                                                                                                                                                     await prisma.priceBookItem.update({ where: { id: Number(req.params.id) }, data: { active: false } });
                                                                                                                                                                                         res.json({ success: true });
                                                                                                                                                                                           } catch (err) { next(err); }
                                                                                                                                                                                           });
                                                                                                                                                                                           
                                                                                                                                                                                           module.exports = router;
                                                                                                                                                                                           
