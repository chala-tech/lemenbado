import { supabase } from '../../lib/supabase.js';
import { HttpError } from '../../middleware/errorHandler.js';

interface CreateAvailabilityInput {
  truckId: string;
  ownerId: string;
  originCityId: number;
  destinationCityId: number;
  availableCapacityKg: number;
  departureWindowStart: string;
  departureWindowEnd: string;
}

export async function createAvailability(input: CreateAvailabilityInput) {
  const { data: truck, error: truckError } = await supabase
    .from('trucks')
    .select('*')
    .eq('id', input.truckId)
    .single();

  if (truckError || !truck) throw new HttpError(404, 'Truck not found');
  if (truck.owner_id !== input.ownerId) throw new HttpError(403, 'This truck does not belong to you');
  if (input.availableCapacityKg > Number(truck.max_capacity_kg)) {
    throw new HttpError(400, `Capacity exceeds this truck's max of ${truck.max_capacity_kg} kg`);
  }

  const { data, error } = await supabase
    .from('truck_availability')
    .insert({
      truck_id: input.truckId,
      origin_city_id: input.originCityId,
      destination_city_id: input.destinationCityId,
      available_capacity_kg: input.availableCapacityKg,
      departure_window_start: input.departureWindowStart,
      departure_window_end: input.departureWindowEnd,
    })
    .select(`
      *,
      origin_city:cities!fk_availability_origin(*),
      dest_city:cities!fk_availability_destination(*),
      truck:trucks(*)
    `)
    .single();

  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function listMyAvailability(ownerId: string) {
  const { data: trucks } = await supabase.from('trucks').select('id').eq('owner_id', ownerId);
  const truckIds = (trucks || []).map((t) => t.id);
  if (truckIds.length === 0) return [];

  const { data, error } = await supabase
    .from('truck_availability')
    .select(`
      *,
      origin_city:cities!fk_availability_origin(*),
      dest_city:cities!fk_availability_destination(*),
      truck:trucks(*)
    `)
    .in('truck_id', truckIds)
    .order('departure_window_start', { ascending: true });

  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function cancelAvailability(id: string, ownerId: string) {
  const { data: availability, error } = await supabase
    .from('truck_availability')
    .select('*, truck:trucks(*)')
    .eq('id', id)
    .single();

  if (error || !availability) throw new HttpError(404, 'Availability not found');
  if (availability.truck.owner_id !== ownerId) throw new HttpError(403, 'Not your availability');

  const { data: updated, error: updateError } = await supabase
    .from('truck_availability')
    .update({ status: 'CANCELLED' })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw new HttpError(500, updateError.message);
  return updated;
}