import { supabase } from '../../lib/supabase.js';
import { HttpError } from '../../middleware/errorHandler.js';

export async function findMatchesForAvailability(truckAvailabilityId: string, ownerId: string) {
  const { data: availability, error } = await supabase
    .from('truck_availability')
    .select('*, truck:trucks(*)')
    .eq('id', truckAvailabilityId)
    .single();

  if (error || !availability) throw new HttpError(404, 'Availability not found');
  if (availability.truck.owner_id !== ownerId) throw new HttpError(403, 'Not your availability');

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
    .gte('required_date', availability.departure_window_start)
    .lte('required_date', availability.departure_window_end);

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
    .lte('departure_window_start', cargoRequest.required_date)
    .gte('departure_window_end', cargoRequest.required_date);

  if (matchError) throw new HttpError(500, matchError.message);
  return data;
}