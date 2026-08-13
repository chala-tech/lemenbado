import { Router } from 'express';
import { createBookingSchema, updateStatusSchema } from './bookings.schema.js';
import * as bookingsService from './bookings.service.js';
import { requireAuth } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';

export const bookingsRouter = Router();

bookingsRouter.use(requireAuth);

bookingsRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

    const booking = await bookingsService.createBooking({
      ...parsed.data,
      requestedByUserId: req.auth!.userId,
    });
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

bookingsRouter.get('/', async (req, res, next) => {
  try {
    const bookings = await bookingsService.listMyBookings(req.auth!.userId);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

bookingsRouter.patch('/:id', async (req, res, next) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

    const updated = await bookingsService.updateBookingStatus(req.params.id, req.auth!.userId, parsed.data.status);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});