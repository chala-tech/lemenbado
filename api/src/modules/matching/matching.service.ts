import { supabase } from '../../lib/supabase.js';
import { HttpError } from '../../middleware/errorHandler.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;


function dayRangeAround(dateIso: string) {
  const date = new Date(dateIso);
  return {
    minusOneDay: new Date(date.getTime() - ONE_DAY_MS).toISOString(),
    plusOneDay: new Date(date.getTime() + ONE_DAY_MS).toISOString(),
  };
}

export async function findMatchesForAvailability(truckAvailabilityId: string, ownerId: string) {
  const { data: availability, error } = await supabase
    .from('truck_availability')
    .select('*, truck:trucks(*)')
    .eq('id', truckAvailabilityId)
    .single();

  if (error || !availability) throw new HttpError(404, 'Availability not found');
  if (availability.truck.owner_id !== ownerId) throw new HttpError(403, 'Not your availability');

  // a cargo request is a candidate if its required_date falls within
  // one day of either end of this truck's departure window
  const windowStart = dayRangeAround(availability.departure_window_start).minusOneDay;
  const windowEnd = dayRangeAround(availability.departure_window_end).plusOneDay;

  const { data, error: matchError } = await supabase
    .from('cargo_requests')
    .select(`
      *,
      origin_city:cities!fk_cargo_origin(*),
      dest_city:cities!fk_cargo_destination(*),
      cargo_type:cargo_types(*)
    `)
    .eq('status', 'OPEN')
    .eq('origin_city_id', availability.origin_city_id)
    .eq('destination_city_id', availability.destination_city_id)
    .lte('weight_kg', availability.available_capacity_kg)
    .gte('required_date', windowStart)
    .lte('required_date', windowEnd);

  if (matchError) throw new HttpError(500, matchError.message);
  return data;
}

export async function findMatchesForCargoRequest(cargoRequestId: string, userId: string) {
  const { data: cargoRequest, error } = await supabase
    .from('cargo_requests')
    .select('*')
    .eq('id', cargoRequestId)
    .single();

  if (error || !cargoRequest) throw new HttpError(404, 'Cargo request not found');

  const { data: membership } = await supabase
    .from('business_members')
    .select('id')
    .eq('user_id', userId)
    .eq('business_id', cargoRequest.business_id)
    .maybeSingle();

  if (!membership) throw new HttpError(403, 'Not your cargo request');

  // a truck availability is a candidate if its departure window
  // reaches within one day of the cargo's required date, on either side
  const { minusOneDay, plusOneDay } = dayRangeAround(cargoRequest.required_date);

  const { data, error: matchError } = await supabase
    .from('truck_availability')
    .select(`
      *,
      origin_city:cities!fk_availability_origin(*),
      dest_city:cities!fk_availability_destination(*),
      truck:trucks(*)
    `)
    .eq('status', 'OPEN')
    .eq('origin_city_id', cargoRequest.origin_city_id)
    .eq('destination_city_id', cargoRequest.destination_city_id)
    .gte('available_capacity_kg', cargoRequest.weight_kg)
    .lte('departure_window_start', plusOneDay)
    .gte('departure_window_end', minusOneDay);

  if (matchError) throw new HttpError(500, matchError.message);
  return data;
}