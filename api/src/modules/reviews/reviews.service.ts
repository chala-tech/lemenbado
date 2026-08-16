import { supabase } from '../../lib/supabase.js';
import { HttpError } from '../../middleware/errorHandler.js';

interface CreateReviewInput {
  bookingId: string;
  reviewerId: string;
  rating: number;
  comment?: string;
}

export async function createReview(input: CreateReviewInput) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, truck_availability(*, truck:trucks(*)), cargo_request:cargo_requests(*)')
    .eq('id', input.bookingId)
    .single();

  if (error || !booking) throw new HttpError(404, 'Booking not found');
  if (booking.status !== 'COMPLETED') {
    throw new HttpError(400, 'Reviews only unlock after a booking is COMPLETED');
  }

  const truckOwnerId = booking.truck_availability.truck.owner_id;
  const { data: cargoMembership } = await supabase
    .from('business_members')
    .select('user_id')
    .eq('business_id', booking.cargo_request.business_id)
    .limit(1)
    .maybeSingle();

  const cargoOwnerId = cargoMembership?.user_id;
  const isReviewerTruckOwner = input.reviewerId === truckOwnerId;
  const isReviewerCargoOwner = input.reviewerId === cargoOwnerId;

  if (!isReviewerTruckOwner && !isReviewerCargoOwner) {
    throw new HttpError(403, 'Not a participant in this booking');
  }

  const revieweeId = isReviewerTruckOwner ? cargoOwnerId : truckOwnerId;
  if (!revieweeId) throw new HttpError(400, 'Could not determine who this review is for');

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', input.bookingId)
    .eq('reviewer_id', input.reviewerId)
    .maybeSingle();

  if (existing) throw new HttpError(409, 'You already reviewed this booking');

  const { data, error: insertError } = await supabase
    .from('reviews')
    .insert({
      booking_id: input.bookingId,
      reviewer_id: input.reviewerId,
      reviewee_id: revieweeId,
      rating: input.rating,
      comment: input.comment ?? null,
    })
    .select()
    .single();

  if (insertError) throw new HttpError(500, insertError.message);
  return data;
}

export async function getUserRatingSummary(userId: string) {
  const { data: reviews, error } = await supabase.from('reviews').select('rating').eq('reviewee_id', userId);
  if (error) throw new HttpError(500, error.message);
  if (!reviews || reviews.length === 0) return { average: null, count: 0 };

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { average: Math.round(average * 10) / 10, count: reviews.length };
}