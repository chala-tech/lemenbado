import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

interface CreateTruckInput {
  ownerId: string;
  truckTypeId: string;
  plateNumber: string;
  maxCapacityKg: number;
}

export async function createTruck(input: CreateTruckInput) {
  const existing = await prisma.truck.findUnique({ where: { plateNumber: input.plateNumber } });
  if (existing) throw new HttpError(409, 'A truck with this plate number already exists');

  return prisma.truck.create({
    data: {
      ownerId: input.ownerId,
      truckTypeId: input.truckTypeId,
      plateNumber: input.plateNumber,
      maxCapacityKg: input.maxCapacityKg,
    },
    include: { truckType: true },
  });
}

export async function listMyTrucks(ownerId: string) {
  return prisma.truck.findMany({
    where: { ownerId },
    include: { truckType: true },
    orderBy: { createdAt: 'desc' },
  });
}