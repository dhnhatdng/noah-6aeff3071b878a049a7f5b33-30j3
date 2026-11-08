import type { ProfileData } from '@/lib/profile/types';
import type { ProfileErrors } from '@/lib/profile/validation';

export interface EditorSectionProps {
    draft: ProfileData;
    errors: ProfileErrors;
    update: (patch: Partial<ProfileData>) => void;
}

export const inputClass = 'h-11 rounded-xl border-border bg-background aria-[invalid=true]:border-destructive';
export const textareaClass = 'rounded-xl border-border bg-background';

export const counter = (value: string, max: number) => `${value.length}/${max}`;
