import { Router } from 'express';
import { registerSchema, loginSchema } from './auth.schema';
import * as authService from './auth.service';
import { requireAuth } from '../../middleware/auth';
import { HttpError } from '../../middleware/errorHandler';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

    const result = await authService.register(parsed.data);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

    const result = await authService.login(parsed.data.phone, parsed.data.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// proves the token round-trips correctly — useful for the frontend to
// confirm a stored session is still valid
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.auth!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});