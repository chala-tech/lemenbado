import { prisma } from '../../lib/prisma';
import { HttpError } from '../../middleware/errorHandler';

// no "create your business" flow yet — auto-provision one the first
// time a cargo owner posts a request, so this isn't blocked on that
async function getOrCreateBusinessId(userId: string, userName: string) {
  const membership = await prisma.businessMember.findFirst({ where: { userId } });
  if (membership) return membership.businessId;

  const business = await prisma.business.create({ data: { name: `${userName} (Cargo Owner)` } });
  await prisma.businessMember.create({
    data: { businessId: business.id, userId, role: 'owner' },
  });
  return business.id;
}

interface CreateCargoRequestInput {
  userId: string;
  userName: string;
  originCityId: number;
  destinationCityId: number;
  weightKg: number;
  cargoTypeId: string;
  requiredDate: string;
  desiredPriceEtb?: number;
}

export async function createCargoRequest(input: CreateCargoRequestInput) {
  const businessId = await getOrCreateBusinessId(input.userId, input.userName);

  return prisma.cargoRequest.create({
    data: {
      businessId,
      originCityId: input.originCityId,
      destinationCityId: input.destinationCityId,
      weightKg: input.weightKg,
      cargoTypeId: input.cargoTypeId,
      requiredDate: new Date(input.requiredDate),
      desiredPriceEtb: input.desiredPriceEtb,
    },
    include: { originCity: true, destCity: true, cargoType: true },
  });
}

export async function listMyCargoRequests(userId: string) {
  const membership = await prisma.businessMember.findFirst({ where: { userId } });
  if (!membership) return [];

  return prisma.cargoRequest.findMany({
    where: { businessId: membership.businessId },
    include: { originCity: true, destCity: true, cargoType: true },
    orderBy: { requiredDate: 'asc' },
  });
}

export async function cancelCargoRequest(id: string, userId: string) {
  const request = await prisma.cargoRequest.findUnique({ where: { id } });
  if (!request) throw new HttpError(404, 'Cargo request not found');

  const membership = await prisma.businessMember.findFirst({
    where: { userId, businessId: request.businessId },
  });
  if (!membership) throw new HttpError(403, 'Not your cargo request');

  return prisma.cargoRequest.update({ where: { id }, data: { status: 'CANCELLED' } });
}