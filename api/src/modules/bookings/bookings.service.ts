import { supabase } from '../../lib/supabase.js';
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
  const [{ data: availability }, { data: cargoRequest }] = await Promise.all([
    supabase.from('truck_availability').select('*').eq('id', input.truckAvailabilityId).single(),
    supabase.from('cargo_requests').select('*').eq('id', input.cargoRequestId).single(),
  ]);

  if (!availability) throw new HttpError(404, 'Truck availability not found');
  if (!cargoRequest) throw new HttpError(404, 'Cargo request not found');
  if (availability.status !== 'OPEN') throw new HttpError(400, 'This truck availability is no longer open');
  if (cargoRequest.status !== 'OPEN') throw new HttpError(400, 'This cargo request is no longer open');

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      truck_availability_id: input.truckAvailabilityId,
      cargo_request_id: input.cargoRequestId,
      requested_by_user_id: input.requestedByUserId,
      status: 'REQUESTED',
    })
    .select('*, truck_availability(*), cargo_request:cargo_requests(*)')
    .single();

  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function listMyBookings(userId: string) {
  const [{ data: trucks }, { data: memberships }] = await Promise.all([
    supabase.from('trucks').select('id').eq('owner_id', userId),
    supabase.from('business_members').select('business_id').eq('user_id', userId),
  ]);

  const truckIds = (trucks || []).map((t) => t.id);
  const businessIds = (memberships || []).map((m) => m.business_id);

  const [byTruck, byBusiness] = await Promise.all([
    truckIds.length
      ? supabase
          .from('bookings')
          .select(`
            *,
            truck_availability:truck_availability!inner(*, origin_city:cities!fk_availability_origin(*), dest_city:cities!fk_availability_destination(*), truck:trucks!inner(*)),
            cargo_request:cargo_requests(*, origin_city:cities!fk_cargo_origin(*), dest_city:cities!fk_cargo_destination(*), cargo_type:cargo_types(*))
          `)
          .in('truck_availability.truck_id', truckIds)
      : Promise.resolve({ data: [] as any[] }),
    businessIds.length
      ? supabase
          .from('bookings')
          .select(`
            *,
            truck_availability:truck_availability(*, origin_city:cities!fk_availability_origin(*), dest_city:cities!fk_availability_destination(*), truck:trucks(*)),
            cargo_request:cargo_requests!inner(*, origin_city:cities!fk_cargo_origin(*), dest_city:cities!fk_cargo_destination(*), cargo_type:cargo_types(*))
          `)
          .in('cargo_request.business_id', businessIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const merged = [...(byTruck.data || []), ...(byBusiness.data || [])];
  const unique = Array.from(new Map(merged.map((b) => [b.id, b])).values());
  return unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

async function assertParticipant(bookingId: string, userId: string) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, truck_availability(*, truck:trucks(*)), cargo_request:cargo_requests(*)')
    .eq('id', bookingId)
    .single();

  if (error || !booking) throw new HttpError(404, 'Booking not found');

  const ownsTruck = booking.truck_availability.truck.owner_id === userId;
  const { data: inCargoBusiness } = await supabase
    .from('business_members')
    .select('id')
    .eq('user_id', userId)
    .eq('business_id', booking.cargo_request.business_id)
    .maybeSingle();

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
    ACCEPTED: { accepted_at: new Date().toISOString() },
    REJECTED: { rejected_at: new Date().toISOString() },
    COMPLETED: { completed_at: new Date().toISOString() },
  };

  const { data: updated, error } = await supabase
    .from('bookings')
    .update({ status: newStatus, ...(timestamps[newStatus] || {}) })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw new HttpError(500, error.message);

  if (newStatus === 'ACCEPTED') {
    await Promise.all([
      supabase.from('truck_availability').update({ status: 'BOOKED' }).eq('id', booking.truck_availability_id),
      supabase.from('cargo_requests').update({ status: 'BOOKED' }).eq('id', booking.cargo_request_id),
    ]);
  }

  return updated;
}