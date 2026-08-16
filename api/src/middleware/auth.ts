import { NextFunction, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { HttpError } from './errorHandler.js';

export interface AuthPayload {
  userId: string;
  role: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return next(new HttpError(401, 'Missing bearer token'));

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return next(new HttpError(401, 'Invalid or expired token'));
    }


    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return next(new HttpError(401, 'User profile not found'));
    }

    req.auth = {
      userId: data.user.id,
      role: profile.role,
      name: profile.name || data.user.email?.split('@')[0] || 'User',
    };

    return next();
  } catch {
    return next(new HttpError(401, 'Invalid or expired token'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return next(new HttpError(403, 'Not allowed for this role'));
    }
    next();
  };
}