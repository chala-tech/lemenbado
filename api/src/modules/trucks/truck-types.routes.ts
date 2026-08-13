import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

export const truckTypesRouter = Router();

truckTypesRouter.get('/', async (_req, res, next) => {
  try {
    const truckTypes = await prisma.truckType.findMany({ orderBy: { name: 'asc' } });
    res.json(truckTypes);
  } catch (err) {
    next(err);
  }
});