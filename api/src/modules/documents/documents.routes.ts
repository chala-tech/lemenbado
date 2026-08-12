import { Router } from 'express';
import { z } from 'zod';
import * as documentsService from '../admin/documents.service';
import { requireAuth } from '../../middleware/auth';
import { HttpError } from '../../middleware/errorHandler';

export const documentsRouter = Router();

const submitSchema = z.object({
  type: z.string().min(1),
  fileUrl: z.string().min(1),
});

documentsRouter.use(requireAuth);

documentsRouter.post('/', async (req, res, next) => {
  try {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

    const document = await documentsService.submitDocument({
      userId: req.auth!.userId,
      ...parsed.data,
    });
    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
});