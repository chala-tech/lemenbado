import { Router } from 'express';
import { registerSchema, loginSchema, updateProfileSchema } from './auth.schema.js';
import * as authService from './auth.service.js';
import { requireAuth, invalidateProfileCache } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { supabase } from '../../lib/supabase.js';
import { env } from '../../lib/env.js';

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

    const result = await authService.login(parsed.data.email, parsed.data.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.auth!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0].message);

    const user = await authService.updateProfile(req.auth!.userId, parsed.data);
    invalidateProfileCache(req.auth!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const email = req.body?.email;
    if (!email || typeof email !== 'string') {
      throw new HttpError(400, 'Email is required');
    }

    
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.frontendOrigin.split(',')[0]}/pages/reset-password.html`,
    });

    res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
});