import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ProfileContext, type ProfileContextValue } from '@/lib/profileContext';
import { PROFILE_STORAGE_KEY, localProfileRepository } from '@/lib/profile/repository';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { supabaseProfileRepository } from '@/lib/supabase/profiles';
import type { ProfileData, UserProfile, WalletIdentity } from '@/lib/profile/types';

/**
 * Supabase repository when the project is configured, localStorage otherwise.
 * The UI only talks to the context, so switching backends changes no UI code.
 * storageKind is exposed so the UI can show which mode is active.
 */
const repository = isSupabaseConfigured() ? supabaseProfileRepository : localProfileRepository;

const ProfileProvider = ({ children }: { children: ReactNode }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready'>('loading');

    useEffect(() => {
        let active = true;
        repository
            .getCurrent()
            .then((p) => active && setProfile(p))
            .finally(() => active && setStatus('ready'));
        return () => {
            active = false;
        };
    }, []);

    // Keep multiple tabs in sync.
    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key === PROFILE_STORAGE_KEY) repository.getCurrent().then(setProfile);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const saveProfile = useCallback(async (data: ProfileData) => {
        const saved = await repository.save(data);
        setProfile(saved);
        return saved;
    }, []);

    const deleteProfile = useCallback(async () => {
        await repository.remove();
        setProfile(null);
    }, []);

    const linkWallet = useCallback(async (wallet: WalletIdentity) => {
        const saved = await repository.setWallet(wallet);
        setProfile(saved);
        return saved;
    }, []);

    const unlinkWallet = useCallback(async () => {
        const saved = await repository.setWallet(null);
        setProfile(saved);
        return saved;
    }, []);

    const value = useMemo<ProfileContextValue>(
        () => ({ profile, status, storageKind: repository.kind, saveProfile, deleteProfile, linkWallet, unlinkWallet }),
        [profile, status, saveProfile, deleteProfile, linkWallet, unlinkWallet],
    );

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export default ProfileProvider;
