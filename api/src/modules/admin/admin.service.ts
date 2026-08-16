import { supabase } from '../../lib/supabase.js';
import { HttpError } from '../../middleware/errorHandler.js';

export async function listUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function suspendListing(type: 'truck-availability' | 'cargo-request', id: string) {
  const table = type === 'truck-availability' ? 'truck_availability' : 'cargo_requests';

  const { data: existing } = await supabase.from(table).select('id').eq('id', id).maybeSingle();
  if (!existing) throw new HttpError(404, `${type === 'truck-availability' ? 'Availability' : 'Cargo request'} not found`);

  const { data, error } = await supabase.from(table).update({ status: 'CANCELLED' }).eq('id', id).select().single();
  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function listAllListings() {
  const [{ data: availabilities, error: avError }, { data: cargoRequests, error: cgError }] = await Promise.all([
    supabase
      .from('truck_availability')
      .select(`
        *,
        origin_city:cities!fk_availability_origin(*),
        dest_city:cities!fk_availability_destination(*),
        truck:trucks(*, owner:users(*))
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('cargo_requests')
      .select(`
        *,
        origin_city:cities!fk_cargo_origin(*),
        dest_city:cities!fk_cargo_destination(*),
        business:businesses(*)
      `)
      .order('created_at', { ascending: false }),
  ]);

  if (avError || cgError) throw new HttpError(500, (avError || cgError)!.message);
  return { availabilities, cargoRequests };
}