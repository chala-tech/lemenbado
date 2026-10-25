import { supabase } from '../../lib/supabase.js';
import { env } from '../../lib/env.js';
import { HttpError } from '../../middleware/errorHandler.js';

interface SubmitDocumentInput {
  userId: string;
  type: string;
  fileUrl: string; 
}

const SIGNED_URL_TTL_SECONDS = 60 * 60; 

async function withSignedUrl<T extends { id: string; file_url: string }>(doc: T) {
  const { data, error } = await supabase.storage
    .from(env.supabaseStorageBucket)
    .createSignedUrl(doc.file_url, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error(`[documents] no viewable file for document ${doc.id} (path: "${doc.file_url}"):`, error?.message);
    return { ...doc, signed_url: null, file_missing: true };
  }

  return { ...doc, signed_url: data.signedUrl, file_missing: false };
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

  // never verify something the admin could not have viewed
  if (outcome === 'VERIFIED') {
    const { data: signed, error: signError } = await supabase.storage
      .from(env.supabaseStorageBucket)
      .createSignedUrl(document.file_url, 60);

    if (signError || !signed?.signedUrl) {
      throw new HttpError(400, 'Cannot verify: the uploaded file is missing. Reject this document and ask the user to upload it again.');
    }
  }

  const { error: updateError } = await supabase.from('documents').update({ status: outcome }).eq('id', documentId);
  if (updateError) throw new HttpError(500, updateError.message);

  const { data, error: verifyError } = await supabase
    .from('verifications')
    .insert({ document_id: documentId, verified_by_id: adminId, outcome })
    .select()
    .single();

  if (verifyError) throw new HttpError(500, verifyError.message);
  return data;
}