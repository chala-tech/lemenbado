import { Router } from 'express';
import { createTruckSchema } from './trucks.schema.js';
import * as trucksService from './trucks.service.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';

export const trucksRouter = Router();

// only truck owners can create/view trucks
trucksRouter.use(requireAuth, requireRole('TRUCK_OWNER'));

trucksRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createTruckSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

    const truck = await trucksService.createTruck({
      ownerId: req.auth!.userId,
      ...parsed.data,
    });
    res.status(201).json(truck);
  } catch (err) {
    next(err);
  }
});

trucksRouter.get('/', async (req, res, next) => {
  try {
    const trucks = await trucksService.listMyTrucks(req.auth!.userId);
    res.json(trucks);
  } catch (err) {
    next(err);
  }
});