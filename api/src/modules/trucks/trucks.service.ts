import { supabase } from '../../lib/supabase.js';
import { HttpError } from '../../middleware/errorHandler.js';

interface CreateTruckInput {
  ownerId: string;
  truckTypeId: string;
  plateNumber: string;
  maxCapacityKg: number;
}

export async function createTruck(input: CreateTruckInput) {
  const { data: existing } = await supabase
    .from('trucks')
    .select('id')
    .eq('plate_number', input.plateNumber)
    .maybeSingle();

  if (existing) throw new HttpError(409, 'A truck with this plate number already exists');

  const { data, error } = await supabase
    .from('trucks')
    .insert({
      owner_id: input.ownerId,
      truck_type_id: input.truckTypeId,
      plate_number: input.plateNumber,
      max_capacity_kg: input.maxCapacityKg,
    })
    .select('*, truck_type:truck_types(*)')
    .single();

  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function listMyTrucks(ownerId: string) {
  const { data, error } = await supabase
    .from('trucks')
    .select('*, truck_type:truck_types(*)')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw new HttpError(500, error.message);
  return data;
}