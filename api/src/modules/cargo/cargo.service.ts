import { supabase } from '../../lib/supabase.js';
import { HttpError } from '../../middleware/errorHandler.js';

async function getOrCreateBusinessId(userId: string, userName: string) {
  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (membership) return membership.business_id;

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert({ name: `${userName} (Cargo Owner)` })
    .select()
    .single();

  if (businessError || !business) throw new HttpError(500, 'Failed to create business');

  const { error: memberError } = await supabase
    .from('business_members')
    .insert({ business_id: business.id, user_id: userId, role: 'owner' });

  if (memberError) throw new HttpError(500, 'Failed to create business membership');

  return business.id;
}

interface CreateCargoRequestInput {
  userId: string;
  userName: string;
  originCityId: number;
  destinationCityId: number;
  weightKg: number;
  cargoTypeId: string;
  requiredDate: string;
  desiredPriceEtb?: number;
}

export async function createCargoRequest(input: CreateCargoRequestInput) {
  const businessId = await getOrCreateBusinessId(input.userId, input.userName);

  const { data, error } = await supabase
    .from('cargo_requests')
    .insert({
      business_id: businessId,
      origin_city_id: input.originCityId,
      destination_city_id: input.destinationCityId,
      weight_kg: input.weightKg,
      cargo_type_id: input.cargoTypeId,
      required_date: input.requiredDate,
      desired_price_etb: input.desiredPriceEtb ?? null,
    })
    .select(`
      *,
      origin_city:cities!fk_cargo_origin(*),
      dest_city:cities!fk_cargo_destination(*),
      cargo_type:cargo_types(*)
    `)
    .single();

  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function listMyCargoRequests(userId: string) {
  const { data: membership } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!membership) return [];

  const { data, error } = await supabase
    .from('cargo_requests')
    .select(`
      *,
      origin_city:cities!fk_cargo_origin(*),
      dest_city:cities!fk_cargo_destination(*),
      cargo_type:cargo_types(*)
    `)
    .eq('business_id', membership.business_id)
    .order('required_date', { ascending: true });

  if (error) throw new HttpError(500, error.message);
  return data;
}

export async function cancelCargoRequest(id: string, userId: string) {
  const { data: request, error } = await supabase.from('cargo_requests').select('*').eq('id', id).single();
  if (error || !request) throw new HttpError(404, 'Cargo request not found');

  const { data: membership } = await supabase
    .from('business_members')
    .select('id')
    .eq('user_id', userId)
    .eq('business_id', request.business_id)
    .maybeSingle();

  if (!membership) throw new HttpError(403, 'Not your cargo request');

  const { data: updated, error: updateError } = await supabase
    .from('cargo_requests')
    .update({ status: 'CANCELLED' })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw new HttpError(500, updateError.message);
  return updated;
}