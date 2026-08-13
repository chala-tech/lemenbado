import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

export const citiesRouter = Router();

citiesRouter.get('/', async (_req, res, next) => {
  try {
    const cities = await prisma.city.findMany({ orderBy: { id: 'asc' } });
    res.json(cities);
  } catch (err) {
    next(err);
  }
});