import { useRef, useState, type ChangeEvent } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAnonUserId, isSupabaseConfigured } from '@/lib/supabase/client';
import { uploadPhoto } from '@/lib/supabase/avatars';
import ProfileAvatar from './ProfileAvatar';

const MAX_BYTES = 5 * 1024 * 1024;
const OUTPUT_SIZE = 320;
const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp'];

/** Center-crops to a square and re-encodes as a small JPEG so it fits in local storage. */
const toResizedDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const side = Math.min(img.naturalWidth, img.naturalHeight);
            const canvas = document.createElement('canvas');
            canvas.width = OUTPUT_SIZE;
            canvas.height = OUTPUT_SIZE;
            const ctx = canvas.getContext('2d');
            URL.revokeObjectURL(url);
            if (!ctx) return reject(new Error('Image processing is not available in this browser.'));
            ctx.drawImage(
                img,
                (img.naturalWidth - side) / 2,
                (img.naturalHeight - side) / 2,
                side,
                side,
                0,
                0,
                OUTPUT_SIZE,
                OUTPUT_SIZE,
            );
            resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('This image could not be read.'));
        };
        img.src = url;
    });

interface PhotoUploadProps {
    value: string | null;
    name: string;
    onChange: (value: string | null) => void;
}

const PhotoUpload = ({ value, name, onChange }: PhotoUploadProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setError(null);
        if (!ACCEPTED.includes(file.type)) return setError('Use a PNG, JPG or WebP image.');
        if (file.size > MAX_BYTES) return setError('Image must be 5 MB or smaller.');
        setBusy(true);
        try {
            // Live mode: upload to the Supabase `avatars` bucket and store the
            // public URL. Demo mode (or no anonymous id yet): keep the existing
            // base64-in-localStorage behaviour exactly as before.
            if (isSupabaseConfigured()) {
                const userId = await getAnonUserId();
                if (userId) {
                    const url = await uploadPhoto(file, userId);
                    if (url) {
                        onChange(url);
                        return;
                    }
                }
            }
            onChange(await toResizedDataUrl(file));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex items-center gap-5">
            <ProfileAvatar name={name} photoUrl={value} size="lg" />
            <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Profile photo</p>
                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg border-border"
                        disabled={busy}
                        onClick={() => inputRef.current?.click()}
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                        {value ? 'Change photo' : 'Upload photo'}
                    </Button>
                    {value && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-lg text-destructive hover:bg-destructive-soft hover:text-destructive"
                            onClick={() => onChange(null)}
                        >
                            <Trash2 className="h-4 w-4" /> Remove
                        </Button>
                    )}
                </div>
                {error ? (
                    <p role="alert" className="text-xs font-medium text-destructive">
                        {error}
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        {isSupabaseConfigured()
                            ? 'PNG, JPG or WebP up to 5 MB. Stored in your Supabase project.'
                            : 'PNG, JPG or WebP up to 5 MB. Cropped to a square.'}
                    </p>
                )}
                <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} className="hidden" onChange={onFile} />
            </div>
        </div>
    );
};

export default PhotoUpload;
