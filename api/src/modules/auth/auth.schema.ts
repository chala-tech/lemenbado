import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['TRUCK_OWNER', 'CARGO_OWNER']),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});