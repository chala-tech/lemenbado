import { supabase } from '../../lib/supabase.js';
import { HttpError } from '../../middleware/errorHandler.js';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: 'TRUCK_OWNER' | 'CARGO_OWNER';
}

function toPublicUser(user: {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
}) {
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name ?? '',
    role: user.role ?? 'USER',
  };
}

export async function register(input: RegisterInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        role: input.role,
        email: input.email,
      },
    },
  });

  if (error || !data.user) {
    throw new HttpError(400, error?.message || 'Registration failed');
  }

  return {
    user: toPublicUser({
      id: data.user.id,
      email: input.email,
      name: input.name,
      role: input.role,
    }),
    token: data.session?.access_token ?? null,
  };
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new HttpError(401, 'Invalid email or password');
  }

  return {
    token: data.session?.access_token ?? null,
    user: toPublicUser({
      id: data.user.id,
      email: data.user.email ?? email,
      name: data.user.user_metadata?.name ?? '',
      role: data.user.app_metadata?.role ?? 'USER',
    }),
  };
}

export async function getUserById(id: string) {
  const { data, error } = await supabase.auth.admin.getUserById(id);
  if (error || !data.user) {
    throw new HttpError(404, 'User not found');
  }

  return toPublicUser(data.user);
}