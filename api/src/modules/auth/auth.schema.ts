import { z } from 'zod';

export const registerSchema = z.object({
  phone: z.string().min(9),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['TRUCK_OWNER', 'CARGO_OWNER']),
});

export const loginSchema = z.object({
  phone: z.string().min(9),
  password: z.string().min(1),
});