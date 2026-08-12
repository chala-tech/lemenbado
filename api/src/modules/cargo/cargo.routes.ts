import { Router } from 'express';
import { createCargoRequestSchema } from './cargo.schema';
import * as cargoService from './cargo.service';
import { requireAuth, requireRole } from '../../middleware/auth';
import { HttpError } from '../../middleware/errorHandler';

export const cargoRouter = Router();

cargoRouter.use(requireAuth, requireRole('CARGO_OWNER'));

cargoRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createCargoRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

    const request = await cargoService.createCargoRequest({
      userId: req.auth!.userId,
      userName: (req.auth as any).name ?? 'Cargo Owner',
      ...parsed.data,
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
});

cargoRouter.get('/', async (req, res, next) => {
  try {
    const list = await cargoService.listMyCargoRequests(req.auth!.userId);
    res.json(list);
  } catch (err) {
    next(err);
  }
});

cargoRouter.patch('/:id/cancel', async (req, res, next) => {
  try {
    const updated = await cargoService.cancelCargoRequest(req.params.id, req.auth!.userId);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});