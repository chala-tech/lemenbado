import { z } from 'zod';

export const createCargoRequestSchema = z
  .object({
    originCityId: z.number().int(),
    destinationCityId: z.number().int(),
    weightKg: z.number().positive(),
    cargoTypeId: z.string().uuid(),
    requiredDate: z.string().datetime(),
    desiredPriceEtb: z.number().positive().optional(),
  })
  .refine((data) => data.originCityId !== data.destinationCityId, {
    message: 'Origin and destination cannot be the same city',
    path: ['destinationCityId'],
  });