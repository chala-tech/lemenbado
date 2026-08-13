import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';


export async function findMatchesForAvailability(truckAvailabilityId: string, ownerId: string) {
  const availability = await prisma.truckAvailability.findUnique({
    where: { id: truckAvailabilityId },
    include: { truck: true },
  });
  if (!availability) throw new HttpError(404, 'Availability not found');
  if (availability.truck.ownerId !== ownerId) throw new HttpError(403, 'Not your availability');

  return prisma.cargoRequest.findMany({
    where: {
      status: 'OPEN',
      originCityId: availability.originCityId,
      destinationCityId: availability.destinationCityId,
      weightKg: { lte: availability.availableCapacityKg },
      requiredDate: {
        gte: availability.departureWindowStart,
        lte: availability.departureWindowEnd,
      },
    },
    include: { originCity: true, destCity: true, cargoType: true },
  });
}

export async function findMatchesForCargoRequest(cargoRequestId: string, userId: string) {
  const cargoRequest = await prisma.cargoRequest.findUnique({ where: { id: cargoRequestId } });
  if (!cargoRequest) throw new HttpError(404, 'Cargo request not found');

  const membership = await prisma.businessMember.findFirst({
    where: { userId, businessId: cargoRequest.businessId },
  });
  if (!membership) throw new HttpError(403, 'Not your cargo request');

  return prisma.truckAvailability.findMany({
    where: {
      status: 'OPEN',
      originCityId: cargoRequest.originCityId,
      destinationCityId: cargoRequest.destinationCityId,
      availableCapacityKg: { gte: cargoRequest.weightKg },
      departureWindowStart: { lte: cargoRequest.requiredDate },
      departureWindowEnd: { gte: cargoRequest.requiredDate },
    },
    include: { originCity: true, destCity: true, truck: true },
  });
}