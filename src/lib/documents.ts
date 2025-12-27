import { supabase } from './supabase';
import type { DocumentRecord } from '../types/documents';

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    fileUrl: row.file_url,
    filePath: row.file_path,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
  }));
}

export async function uploadDocument(
  file: File,
  name: string,
  userId: string
): Promise<DocumentRecord> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('documents')
    .insert({
      name,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: urlData.publicUrl,
      file_path: filePath,
      uploaded_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    fileName: data.file_name,
    fileType: data.file_type,
    fileSize: data.file_size,
    fileUrl: data.file_url,
    filePath: data.file_path,
    uploadedBy: data.uploaded_by,
    uploadedAt: data.uploaded_at,
  };
}

export async function deleteDocument(id: string, filePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  if (storageError) throw storageError;

  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (dbError) throw dbError;
}
