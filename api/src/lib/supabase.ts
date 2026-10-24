import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
};

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, clientOptions);

export function createAuthClient() {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, clientOptions);
}