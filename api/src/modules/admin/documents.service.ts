import { supabase } from '../../lib/supabase.js';
import { env } from '../../lib/env.js';
import { HttpError } from '../../middleware/errorHandler.js';

interface SubmitDocumentInput {
  userId: string;
  type: string;
  fileUrl: string; // storage path, not a public URL — bucket is private
}

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour, enough for one review session

async function withSignedUrl<T extends { file_url: string }>(doc: T) {
  const { data } = await supabase.storage
    .from(env.supabaseStorageBucket)
    .createSignedUrl(doc.file_url, SIGNED_URL_TTL_SECONDS);

  return { ...doc, signed_url: data?.signedUrl ?? null };
}

export async function submitDocument(input: SubmitDocumentInput) {
  const { data, error } = await supabase
    .from('documents')
    .insert({ user_id: input.userId, type: input.type, file_url: input.fileUrl, status: 'PENDING' })
    .select()
    .single();

  if (error) throw new HttpError(500, error.message);
  return withSignedUrl(data);
}

export async function listMyDocuments(userId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new HttpError(500, error.message);
  return Promise.all((data || []).map(withSignedUrl));
}

export async function listPendingDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*, user:users(id, name, email, role)')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true });

  if (error) throw new HttpError(500, error.message);
  return Promise.all((data || []).map(withSignedUrl));
}

export async function decideDocument(documentId: string, adminId: string, outcome: 'VERIFIED' | 'REJECTED') {
  const { data: document, error } = await supabase.from('documents').select('*').eq('id', documentId).single();
  if (error || !document) throw new HttpError(404, 'Document not found');

  await supabase.from('documents').update({ status: outcome }).eq('id', documentId);

  const { data, error: verifyError } = await supabase
    .from('verifications')
    .insert({ document_id: documentId, verified_by_id: adminId, outcome })
    .select()
    .single();

  if (verifyError) throw new HttpError(500, verifyError.message);
  return data;
}