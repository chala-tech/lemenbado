import { z } from 'zod';

export const createTruckSchema = z.object({
  truckTypeId: z.string().uuid(),
  plateNumber: z.string().min(3),
  maxCapacityKg: z.number().positive(),
});