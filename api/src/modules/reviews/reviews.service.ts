import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../middleware/errorHandler.js';

interface CreateReviewInput {
  bookingId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
}

export async function createReview(input: CreateReviewInput) {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: {
      truckAvailability: { include: { truck: true } },
      cargoRequest: true,
    },
  });
  if (!booking) throw new HttpError(404, 'Booking not found');
  if (booking.status !== 'COMPLETED') {
    throw new HttpError(400, 'Reviews only unlock after a booking is COMPLETED');
  }

  const truckOwnerId = booking.truckAvailability.truck.ownerId;
  const cargoMembership = await prisma.businessMember.findFirst({
    where: { businessId: booking.cargoRequest.businessId },
  });
  const cargoOwnerId = cargoMembership?.userId;

  const isReviewerTruckOwner = input.reviewerId === truckOwnerId;
  const isReviewerCargoOwner = input.reviewerId === cargoOwnerId;
  if (!isReviewerTruckOwner && !isReviewerCargoOwner) {
    throw new HttpError(403, 'Not a participant in this booking');
  }

  const revieweeId = isReviewerTruckOwner ? cargoOwnerId : truckOwnerId;
  if (!revieweeId) throw new HttpError(400, 'Could not determine who this review is for');

  const existing = await prisma.review.findFirst({
    where: { bookingId: input.bookingId, reviewerId: input.reviewerId },
  });
  if (existing) throw new HttpError(409, 'You already reviewed this booking');

  return prisma.review.create({
    data: {
      bookingId: input.bookingId,
      reviewerId: input.reviewerId,
      revieweeId,
      rating: input.rating,
      comment: input.comment,
    },
  });
}

export async function getUserRatingSummary(userId: string) {
  const reviews = await prisma.review.findMany({ where: { revieweeId: userId } });
  if (reviews.length === 0) return { average: null, count: 0 };

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { average: Math.round(average * 10) / 10, count: reviews.length };
}