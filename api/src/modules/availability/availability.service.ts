import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

interface CreateAvailabilityInput {
  truckId: string;
  ownerId: string;
  originCityId: number;
  destinationCityId: number;
  availableCapacityKg: number;
  departureWindowStart: string;
  departureWindowEnd: string;
}

export async function createAvailability(input: CreateAvailabilityInput) {
  const truck = await prisma.truck.findUnique({ where: { id: input.truckId } });
  if (!truck) throw new HttpError(404, 'Truck not found');
  if (truck.ownerId !== input.ownerId) throw new HttpError(403, 'This truck does not belong to you');
  if (input.availableCapacityKg > Number(truck.maxCapacityKg)) {
    throw new HttpError(400, `Capacity exceeds this truck's max of ${truck.maxCapacityKg} kg`);
  }

  return prisma.truckAvailability.create({
    data: {
      truckId: input.truckId,
      originCityId: input.originCityId,
      destinationCityId: input.destinationCityId,
      availableCapacityKg: input.availableCapacityKg,
      departureWindowStart: new Date(input.departureWindowStart),
      departureWindowEnd: new Date(input.departureWindowEnd),
    },
    include: { originCity: true, destCity: true, truck: true },
  });
}

export async function listMyAvailability(ownerId: string) {
  return prisma.truckAvailability.findMany({
    where: { truck: { ownerId } },
    include: { originCity: true, destCity: true, truck: true },
    orderBy: { departureWindowStart: 'asc' },
  });
}

export async function cancelAvailability(id: string, ownerId: string) {
  const availability = await prisma.truckAvailability.findUnique({
    where: { id },
    include: { truck: true },
  });
  if (!availability) throw new HttpError(404, 'Availability not found');
  if (availability.truck.ownerId !== ownerId) throw new HttpError(403, 'Not your availability');

  return prisma.truckAvailability.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });
}