import { Router } from 'express';
import { z } from 'zod';
import * as reviewsService from './reviews.service';
import { requireAuth } from '../../middleware/auth';
import { HttpError } from '../../middleware/errorHandler';

export const reviewsRouter = Router();

const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

reviewsRouter.use(requireAuth);

reviewsRouter.post('/', async (req, res, next) => {
  try {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

    const review = await reviewsService.createReview({
      reviewerId: req.auth!.userId,
      ...parsed.data,
    });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});

reviewsRouter.get('/users/:userId/summary', async (req, res, next) => {
  try {
    res.json(await reviewsService.getUserRatingSummary(req.params.userId));
  } catch (err) {
    next(err);
  }
});