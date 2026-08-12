import { z } from 'zod';

export const createBookingSchema = z.object({
  truckAvailabilityId: z.string().uuid(),
  cargoRequestId: z.string().uuid(),
});

export const BOOKING_STATUSES = [
  'ACCEPTED', 'REJECTED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED',
] as const;

export const updateStatusSchema = z.object({
  status: z.enum(BOOKING_STATUSES),
});