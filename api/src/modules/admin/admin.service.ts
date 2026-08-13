import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, phone: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function suspendListing(type: 'truck-availability' | 'cargo-request', id: string) {
  if (type === 'truck-availability') {
    const existing = await prisma.truckAvailability.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Availability not found');
    return prisma.truckAvailability.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  const existing = await prisma.cargoRequest.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, 'Cargo request not found');
  return prisma.cargoRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
}

export async function listAllListings() {
  const [availabilities, cargoRequests] = await Promise.all([
    prisma.truckAvailability.findMany({
      include: { originCity: true, destCity: true, truck: { include: { owner: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.cargoRequest.findMany({
      include: { originCity: true, destCity: true, business: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  return { availabilities, cargoRequests };
}