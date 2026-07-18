import { createClient } from '@/lib/supabase/client';

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Try server API route first to bypass RLS violations and auto-create bucket if needed
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const res = await fetch('/api/profile/upload-avatar', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.publicUrl) {
        return data.publicUrl;
      }
    } else {
      const errJson = await res.json().catch(() => ({}));
      if (errJson.error) {
        throw new Error(errJson.error);
      }
    }
  } catch (apiErr: unknown) {
    console.warn('[Avatar Upload] Server route fallback:', apiErr);
    if (apiErr instanceof Error && !apiErr.message.toLowerCase().includes('failed to fetch')) {
      throw apiErr;
    }
  }

  // Fallback to client SDK upload if server route is unreachable
  const supabase = createClient();
  const fileExt = file.name.split('.').pop() || 'png';
  const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

  return data.publicUrl;
}
