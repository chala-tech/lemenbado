import { Router } from 'express';
import * as matchingService from './matching.service.js';
import { requireAuth } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';

export const matchingRouter = Router();

matchingRouter.use(requireAuth);


matchingRouter.get('/', async (req, res, next) => {
  try {
    const { truckAvailabilityId, cargoRequestId } = req.query;

    if (typeof truckAvailabilityId === 'string') {
      const matches = await matchingService.findMatchesForAvailability(truckAvailabilityId, req.auth!.userId);
      return res.json(matches);
    }

    if (typeof cargoRequestId === 'string') {
      const matches = await matchingService.findMatchesForCargoRequest(cargoRequestId, req.auth!.userId);
      return res.json(matches);
    }

    throw new HttpError(400, 'Provide either truckAvailabilityId or cargoRequestId as a query param');
  } catch (err) {
    next(err);
  }
});