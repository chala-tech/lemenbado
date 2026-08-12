import { Router } from 'express';
import { createAvailabilitySchema } from './availability.schema';
import * as availabilityService from './availability.service';
import { requireAuth, requireRole } from '../../middleware/auth';
import { HttpError } from '../../middleware/errorHandler';

export const availabilityRouter = Router();

availabilityRouter.use(requireAuth, requireRole('TRUCK_OWNER'));

availabilityRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createAvailabilitySchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

    const availability = await availabilityService.createAvailability({
      ownerId: req.auth!.userId,
      ...parsed.data,
    });
    res.status(201).json(availability);
  } catch (err) {
    next(err);
  }
});

availabilityRouter.get('/', async (req, res, next) => {
  try {
    const list = await availabilityService.listMyAvailability(req.auth!.userId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

availabilityRouter.patch('/:id/cancel', async (req, res, next) => {
  try {
    const updated = await availabilityService.cancelAvailability(req.params.id, req.auth!.userId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});