import { generateId } from './ids';
import { normalizeProfileData } from './normalize';
import { PROFILE_SCHEMA_VERSION, type ProfileData, type UserProfile, type WalletIdentity } from './types';

/**
 * Storage abstraction for the current user's profile.
 * Local: localStorage (this browser only). Supabase: src/lib/supabase/profiles.ts
 * (same interface, chosen by ProfileProvider when Supabase is configured).
 * Demo profiles are bundled, read-only data and never pass through this repository.
 */
export interface ProfileRepository {
    readonly kind: 'local' | 'supabase';
    getCurrent(): Promise<UserProfile | null>;
    /** Creates the profile if none exists, otherwise updates it. */
    save(data: ProfileData): Promise<UserProfile>;
    setWallet(wallet: WalletIdentity | null): Promise<UserProfile>;
    remove(): Promise<void>;
}

export class ProfileStorageError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ProfileStorageError';
    }
}

export const PROFILE_STORAGE_KEY = 'bc:v1:user-profile';

const isWalletIdentity = (v: unknown): v is WalletIdentity => {
    const o = v as Record<string, unknown> | null;
    return Boolean(
        o && typeof o.address === 'string' && typeof o.provider === 'string' && typeof o.network === 'string' && typeof o.linkedAt === 'string',
    );
};

const read = (): UserProfile | null => {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    try {
        const o = JSON.parse(raw) as Record<string, unknown>;
        if (typeof o.id !== 'string' || o.kind !== 'user') throw new Error('Invalid profile record');
        return {
            ...normalizeProfileData(o),
            id: o.id,
            kind: 'user',
            schemaVersion: PROFILE_SCHEMA_VERSION,
            wallet: isWalletIdentity(o.wallet) ? o.wallet : null,
            createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
            updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
        };
    } catch (error) {
        // Keep the unreadable record for recovery instead of silently discarding it.
        console.warn('[profile] Stored profile could not be read', error);
        localStorage.setItem(`${PROFILE_STORAGE_KEY}:corrupt`, raw);
        localStorage.removeItem(PROFILE_STORAGE_KEY);
        return null;
    }
};

const write = (profile: UserProfile): UserProfile => {
    try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        return profile;
    } catch {
        throw new ProfileStorageError('Your browser blocked saving or storage is full. Try a smaller profile photo.');
    }
};

const requireCurrent = (): UserProfile => {
    const current = read();
    if (!current) throw new ProfileStorageError('No profile found. Create your profile first.');
    return current;
};

export const localProfileRepository: ProfileRepository = {
    kind: 'local',
    async getCurrent() {
        return read();
    },
    async save(data) {
        const now = new Date().toISOString();
        const current = read();
        const clean = normalizeProfileData(data);
        if (current) return write({ ...current, ...clean, updatedAt: now });
        return write({
            ...clean,
            id: generateId(),
            kind: 'user',
            schemaVersion: PROFILE_SCHEMA_VERSION,
            wallet: null,
            createdAt: now,
            updatedAt: now,
        });
    },
    async setWallet(wallet) {
        const current = requireCurrent();
        return write({ ...current, wallet, updatedAt: new Date().toISOString() });
    },
    async remove() {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
    },
};
