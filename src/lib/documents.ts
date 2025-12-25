import { supabase } from './supabase';
import type { DocumentRecord } from '../types/documents';

const DOCUMENTS_BUCKET = 'documents';

const mapDocumentRow = (row: Record<string, unknown>): DocumentRecord => ({
  id: (row.id as string) ?? '',
  name: (row.name as string) ?? '',
  fileName: (row.file_name as string) ?? '',
  fileType: (row.file_type as string | null) ?? null,
  fileSize: (row.file_size as number | null) ?? null,
  fileUrl: (row.file_url as string | null) ?? null,
  filePath: (row.file_path as string) ?? '',
  uploadedBy: (row.uploaded_by as string | null) ?? null,
  uploadedAt: (row.uploaded_at as string) ?? '',
});

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, name, file_name, file_type, file_size, file_url, file_path, uploaded_by, uploaded_at')
    .order('uploaded_at', { ascending: false });

  if (error) {
    const isMissingTable =
      error.code === 'PGRST302' ||
      error.code === '42P01' ||
      error.message?.toLowerCase().includes('could not find the table');

    if (isMissingTable) {
      throw new Error(
        'Documents table is missing in Supabase. Run the documents migration and refresh the PostgREST schema cache.'
      );
    }

    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapDocumentRow(row as Record<string, unknown>));
}

export async function uploadDocument(
  file: File,
  options: { name: string; uploadedBy?: string | null }
): Promise<DocumentRecord> {
  const ext = file.name.includes('.') ? file.name.split('.').pop() ?? 'dat' : 'dat';
  const safeName = options.name.trim() || file.name;
  const path = `${options.uploadedBy ?? 'unknown'}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Failed to upload document: ${uploadError.message}`);
  }

  const { data: publicData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path);

  const { data, error: insertError } = await supabase
    .from('documents')
    .insert({
      name: safeName,
      file_name: file.name,
      file_type: file.type || null,
      file_size: file.size ?? null,
      file_url: publicData?.publicUrl ?? null,
      file_path: path,
      uploaded_by: options.uploadedBy ?? null,
    })
    .select('*')
    .single();

  if (insertError) {
    // Best-effort cleanup if DB insert fails
    void supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    throw new Error(insertError.message);
  }

  return mapDocumentRow(data as Record<string, unknown>);
}

export async function deleteDocument(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const filePath = (data as { file_path: string }).file_path;
  await supabase.from('documents').delete().eq('id', id);
  if (filePath) {
    const { error: storageError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
    if (storageError) {
      throw new Error(storageError.message);
    }
  }
}


