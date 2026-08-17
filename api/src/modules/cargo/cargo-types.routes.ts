import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';

export const cargoTypesRouter = Router();

cargoTypesRouter.get('/', async (_req, res, next) => {
  try {
    const { data, error } = await supabase.from('cargo_types').select('*').order('name', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});