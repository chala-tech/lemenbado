import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';

export const citiesRouter = Router();

citiesRouter.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('cities').select('*').order('id', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});