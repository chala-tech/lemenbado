import { supabase } from './supabase.js';

/**
 * Sweeps the database for anything whose real-world deadline has
 * passed and updates its status to reflect that — instead of leaving
 * stale OPEN/REQUESTED rows sitting around looking active forever.
 *
 * Three things get checked, in order (order matters: bookings must
 * be cancelled before we touch the cargo_request/truck_availability
 * they point to, since a booking's own expiry depends on its cargo's
 * required_date).
 */
export async function sweepExpiredEntities() {
  const now = new Date().toISOString();

  // 1. Cargo requests whose required_date has passed, still OPEN or
  //    MATCHED — nobody can book something that needed to move already.
  const { data: expiredCargo, error: cargoError } = await supabase
    .from('cargo_requests')
    .update({ status: 'EXPIRED' })
    .in('status', ['OPEN', 'MATCHED'])
    .lt('required_date', now)
    .select('id');

  if (cargoError) console.error('[expiry] cargo_requests sweep failed:', cargoError.message);

  // 2. Truck availabilities whose departure window has fully closed,
  //    still OPEN — the truck's window to depart has already ended.
  const { data: expiredAvailability, error: availError } = await supabase
    .from('truck_availability')
    .update({ status: 'EXPIRED' })
    .eq('status', 'OPEN')
    .lt('departure_window_end', now)
    .select('id');

  if (availError) console.error('[expiry] truck_availability sweep failed:', availError.message);

  // 3. Bookings still REQUESTED, where the cargo side has now expired —
  //    booking_status has no EXPIRED value, so the correct terminal
  //    state per the schema is CANCELLED.
  const { data: staleBookings, error: bookingsFetchError } = await supabase
    .from('bookings')
    .select('id, cargo_request:cargo_requests(required_date)')
    .eq('status', 'REQUESTED');

  if (bookingsFetchError) {
    console.error('[expiry] fetching REQUESTED bookings failed:', bookingsFetchError.message);
  } else {
    const idsToCancel = (staleBookings || [])
      .filter((b: any) => b.cargo_request?.required_date && new Date(b.cargo_request.required_date) < new Date(now))
      .map((b: any) => b.id);

    if (idsToCancel.length > 0) {
      const { error: cancelError } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .in('id', idsToCancel);

      if (cancelError) console.error('[expiry] cancelling stale bookings failed:', cancelError.message);
    }
  }

  const cargoCount = expiredCargo?.length || 0;
  const availCount = expiredAvailability?.length || 0;
  const bookingCount = (staleBookings || []).filter((b: any) =>
    b.cargo_request?.required_date && new Date(b.cargo_request.required_date) < new Date(now)
  ).length;

  if (cargoCount || availCount || bookingCount) {
    console.log(`[expiry] swept ${cargoCount} cargo requests, ${availCount} availabilities, ${bookingCount} bookings`);
  }
}