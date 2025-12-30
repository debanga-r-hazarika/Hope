import { supabase } from './supabase';
import type { DocumentRecord } from '../types/documents';

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function uploadDocument(
  file: File,
  name: string,
  userId: string
): Promise<DocumentRecord> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `documents/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  const { data, error } = await supabase
    .from('documents')
    .insert([
      {
        name,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: publicUrlData.publicUrl,
        file_path: filePath,
        uploaded_by: userId,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
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
