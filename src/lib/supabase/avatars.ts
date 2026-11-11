import { isSupabaseConfigured, supabase } from './client';

/** Public Storage bucket for profile photos (create it in the Supabase dashboard). */
export const AVATAR_BUCKET = 'avatars';

const safeFileName = (name: string): string => name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'photo';

/**
 * Uploads a profile photo to the `avatars` bucket at
 * `<userId>/<timestamp>-<filename>` and returns its public URL.
 *
 * Returns null when Supabase is not configured, so callers fall back to the
 * existing base64-in-localStorage behaviour (demo mode). Throws on upload
 * failure so the caller can show the error instead of silently downgrading.
 */
export const uploadPhoto = async (file: File, userId: string): Promise<string | null> => {
    if (!supabase || !isSupabaseConfigured()) return null;
    const path = `${userId}/${Date.now()}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
    });
    if (error) throw new Error(`Photo upload failed: ${error.message}`);
    const {
        data: { publicUrl },
    } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    return publicUrl;
};
