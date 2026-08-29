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

// short-lived cache so a burst of near-simultaneous requests from one
// page load (dashboard fires several calls at once) doesn't each pay
// a separate round-trip to fetch the same user's role/name
interface CachedProfile {
  role: string;
  name: string;
  expiresAt: number;
}
const profileCache = new Map<string, CachedProfile>();
const CACHE_TTL_MS = 15_000;

export function invalidateProfileCache(userId: string) {
  profileCache.delete(userId);
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

    const cached = profileCache.get(data.user.id);
    let role: string;
    let name: string;

    if (cached && cached.expiresAt > Date.now()) {
      role = cached.role;
      name = cached.name;
    } else {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, name')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        return next(new HttpError(401, 'User profile not found'));
      }

      role = profile.role;
      name = profile.name;
      profileCache.set(data.user.id, { role, name, expiresAt: Date.now() + CACHE_TTL_MS });
    }

    req.auth = {
      userId: data.user.id,
      role,
      name: name || data.user.email?.split('@')[0] || 'User',
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