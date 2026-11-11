import { getAnonUserId, supabase } from './client';
import { fromProfileRow, toProfileRow, type ProfileRow } from '@/lib/profile/supabaseMapping';
import { generateId } from '@/lib/profile/ids';
import { PROFILE_SCHEMA_VERSION, type ProfileData, type UserProfile, type WalletIdentity } from '@/lib/profile/types';
import { ProfileStorageError, type ProfileRepository } from '@/lib/profile/repository';

/**
 * Supabase implementation of ProfileRepository (same interface as the local
 * one, so UI code does not change). Rows are owned by the anonymous Supabase
 * user id (see getAnonUserId); the row `id` stays a separate client UUID so
 * existing local ids survive a move to Supabase.
 *
 * wallet_verified_at is NEVER written by toProfileRow (it is omitted there
 * on purpose): it is only set by markWalletVerified() after a signature
 * check, or cleared when the linked wallet address changes / is removed.
 */
export interface PublicProfileEntry {
    profile: UserProfile;
    /** Supabase auth user id that owns the row (needed for connection requests). */
    ownerId: string;
}

const requireClient = () => {
    if (!supabase) throw new ProfileStorageError('Supabase is not configured.');
    return supabase;
};

const requireOwnerId = async (): Promise<string> => {
    const ownerId = await getAnonUserId();
    if (!ownerId) {
        throw new ProfileStorageError(
            'Supabase anonymous sign-in is not available. Enable anonymous sign-ins in the Supabase dashboard (Authentication → Sign-in providers → Anonymous).',
        );
    }
    return ownerId;
};

const readOwnRow = async (ownerId: string): Promise<ProfileRow | null> => {
    const client = requireClient();
    const { data, error } = await client.from('profiles').select('*').eq('owner_id', ownerId).maybeSingle();
    if (error) throw new ProfileStorageError(`Could not load your profile: ${error.message}`);
    return (data as ProfileRow | null) ?? null;
};

/**
 * Upserts the profile row, then keeps wallet_verified_at truthful:
 * cleared whenever the linked address changed or was removed (a proof for
 * address A must never attest address B).
 */
const upsertProfile = async (profile: UserProfile, ownerId: string): Promise<UserProfile> => {
    const client = requireClient();
    const previous = await readOwnRow(ownerId);
    const { data, error } = await client
        .from('profiles')
        .upsert(toProfileRow(profile, ownerId), { onConflict: 'owner_id' })
        .select()
        .single();
    if (error || !data) {
        throw new ProfileStorageError(`Could not save your profile: ${error?.message ?? 'no row returned'}`);
    }
    const saved = fromProfileRow(data as ProfileRow);
    const previousAddress = previous?.wallet_address ?? null;
    const nextAddress = saved.wallet?.address ?? null;
    if (previousAddress !== nextAddress) {
        const { error: clearError } = await client
            .from('profiles')
            .update({ wallet_verified_at: null })
            .eq('owner_id', ownerId);
        if (clearError) {
            console.warn('[supabase] Could not clear stale wallet verification', clearError.message);
        }
    }
    return saved;
};

export const supabaseProfileRepository: ProfileRepository & {
    /** Writes wallet_address + wallet_verified_at after a signature check. Returns false when no profile row exists yet. */
    markWalletVerified: (address: string, verifiedAt: string) => Promise<boolean>;
} = {
    kind: 'supabase',

    async getCurrent() {
        if (!supabase) return null;
        const ownerId = await getAnonUserId();
        if (!ownerId) return null;
        const row = await readOwnRow(ownerId);
        return row ? fromProfileRow(row) : null;
    },

    async save(data: ProfileData) {
        const ownerId = await requireOwnerId();
        const now = new Date().toISOString();
        const current = await this.getCurrent();
        const profile: UserProfile = current
            ? { ...current, ...data, updatedAt: now }
            : {
                  ...data,
                  id: generateId(),
                  kind: 'user',
                  schemaVersion: PROFILE_SCHEMA_VERSION,
                  wallet: null,
                  createdAt: now,
                  updatedAt: now,
              };
        return upsertProfile(profile, ownerId);
    },

    async setWallet(wallet: WalletIdentity | null) {
        const ownerId = await requireOwnerId();
        const current = await this.getCurrent();
        if (!current) throw new ProfileStorageError('No profile found. Create your profile first.');
        return upsertProfile({ ...current, wallet, updatedAt: new Date().toISOString() }, ownerId);
    },

    async remove() {
        if (!supabase) return;
        const ownerId = await getAnonUserId();
        if (!ownerId) return;
        const { error } = await supabase.from('profiles').delete().eq('owner_id', ownerId);
        if (error) throw new ProfileStorageError(`Could not delete your profile: ${error.message}`);
    },

    async markWalletVerified(address: string, verifiedAt: string) {
        if (!supabase) return false;
        const ownerId = await getAnonUserId();
        if (!ownerId) return false;
        const { data, error } = await supabase
            .from('profiles')
            .update({ wallet_address: address, wallet_verified_at: verifiedAt })
            .eq('owner_id', ownerId)
            .select('id');
        if (error) {
            console.warn('[supabase] Could not write wallet verification', error.message);
            return false;
        }
        return Array.isArray(data) && data.length > 0;
    },
};

/** All public profiles, newest first. Pass the viewer's owner id to exclude themself. */
export const listPublicProfilesWithOwners = async (excludeOwnerId?: string): Promise<PublicProfileEntry[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
        console.warn('[supabase] Could not list profiles', error.message);
        return [];
    }
    return ((data as ProfileRow[]) ?? [])
        .filter((row) => row.owner_id !== excludeOwnerId)
        .map((row) => ({ profile: fromProfileRow(row), ownerId: row.owner_id }));
};

export const listPublicProfiles = async (excludeOwnerId?: string): Promise<UserProfile[]> =>
    (await listPublicProfilesWithOwners(excludeOwnerId)).map((entry) => entry.profile);
