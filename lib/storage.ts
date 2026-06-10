import { getSupabaseBrowserClient } from './supabase'

export interface UploadResult {
  path: string
  url: string
  error?: string
}

/**
 * Uploads a file to Supabase Storage
 * Path: project-qr-files/{user_id}/{project_id}/{report_id}/{filename}
 */
export async function uploadFile(
  file: File,
  userId: string,
  projectId: string,
  reportId: string
): Promise<UploadResult> {
  const supabase = getSupabaseBrowserClient()
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const randomName = `${crypto.randomUUID()}.${ext}`
  const path = `${userId}/${projectId}/${reportId}/${randomName}`
  
  const { data, error } = await supabase.storage
    .from('project-qr-files')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    return { path: '', url: '', error: error.message }
  }

  const { data: urlData } = supabase.storage
    .from('project-qr-files')
    .getPublicUrl(data.path)

  return {
    path: data.path,
    url: urlData.publicUrl,
  }
}

/**
 * Gets the public URL for a stored file
 */
export function getFileUrl(path: string): string {
  const supabase = getSupabaseBrowserClient()
  const { data } = supabase.storage
    .from('project-qr-files')
    .getPublicUrl(path)
  return data.publicUrl
}

/**
 * Deletes a file from storage
 */
export async function deleteFile(path: string): Promise<{ error?: string }> {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.storage
    .from('project-qr-files')
    .remove([path])
  
  if (error) return { error: error.message }
  return {}
}
