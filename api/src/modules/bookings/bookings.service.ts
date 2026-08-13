import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';


const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

interface CreateBookingInput {
  truckAvailabilityId: string;
  cargoRequestId: string;
  requestedByUserId: string;
}

export async function createBooking(input: CreateBookingInput) {
  const [availability, cargoRequest] = await Promise.all([
    prisma.truckAvailability.findUnique({ where: { id: input.truckAvailabilityId } }),
    prisma.cargoRequest.findUnique({ where: { id: input.cargoRequestId } }),
  ]);

  if (!availability) throw new HttpError(404, 'Truck availability not found');
  if (!cargoRequest) throw new HttpError(404, 'Cargo request not found');
  if (availability.status !== 'OPEN') throw new HttpError(400, 'This truck availability is no longer open');
  if (cargoRequest.status !== 'OPEN') throw new HttpError(400, 'This cargo request is no longer open');

  return prisma.booking.create({
    data: {
      truckAvailabilityId: input.truckAvailabilityId,
      cargoRequestId: input.cargoRequestId,
      requestedByUserId: input.requestedByUserId,
      status: 'REQUESTED',
    },
    include: { truckAvailability: true, cargoRequest: true },
  });
}

export async function listMyBookings(userId: string) {
  // a booking is "mine" if I own the truck, or I'm in the business that owns the cargo
  const [ownedTruckIds, businessIds] = await Promise.all([
    prisma.truck.findMany({ where: { ownerId: userId }, select: { id: true } }),
    prisma.businessMember.findMany({ where: { userId }, select: { businessId: true } }),
  ]);

  return prisma.booking.findMany({
    where: {
      OR: [
        { truckAvailability: { truckId: { in: ownedTruckIds.map((t) => t.id) } } },
        { cargoRequest: { businessId: { in: businessIds.map((b) => b.businessId) } } },
      ],
    },
    include: {
      truckAvailability: { include: { originCity: true, destCity: true, truck: true } },
      cargoRequest: { include: { originCity: true, destCity: true, cargoType: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function assertParticipant(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      truckAvailability: { include: { truck: true } },
      cargoRequest: true,
    },
  });
  if (!booking) throw new HttpError(404, 'Booking not found');

  const ownsTruck = booking.truckAvailability.truck.ownerId === userId;
  const inCargoBusiness = await prisma.businessMember.findFirst({
    where: { userId, businessId: booking.cargoRequest.businessId },
  });

  if (!ownsTruck && !inCargoBusiness) throw new HttpError(403, 'Not a participant in this booking');
  return booking;
}

export async function updateBookingStatus(bookingId: string, userId: string, newStatus: string) {
  const booking = await assertParticipant(bookingId, userId);

  const allowed = ALLOWED_TRANSITIONS[booking.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new HttpError(400, `Cannot move a ${booking.status} booking to ${newStatus}`);
  }

  const timestamps: Record<string, object> = {
    ACCEPTED: { acceptedAt: new Date() },
    REJECTED: { rejectedAt: new Date() },
    COMPLETED: { completedAt: new Date() },
  };

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: newStatus as any, ...(timestamps[newStatus] || {}) },
  });

  // once accepted, the underlying listings are no longer open to other matches
  if (newStatus === 'ACCEPTED') {
    await prisma.truckAvailability.update({
      where: { id: booking.truckAvailabilityId },
      data: { status: 'BOOKED' },
    });
    await prisma.cargoRequest.update({
      where: { id: booking.cargoRequestId },
      data: { status: 'BOOKED' },
    });
  }

  return updated;
}