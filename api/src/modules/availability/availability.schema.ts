import { z } from 'zod';

export const createAvailabilitySchema = z
  .object({
    truckId: z.string().uuid(),
    originCityId: z.number().int(),
    destinationCityId: z.number().int(),
    availableCapacityKg: z.number().positive(),
    departureWindowStart: z.string().datetime(),
    departureWindowEnd: z.string().datetime(),
  })
  .refine((data) => data.originCityId !== data.destinationCityId, {
    message: 'Origin and destination cannot be the same city',
    path: ['destinationCityId'],
  })
  .refine((data) => new Date(data.departureWindowEnd) > new Date(data.departureWindowStart), {
    message: 'Departure window end must be after start',
    path: ['departureWindowEnd'],
  });