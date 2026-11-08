import { createContext } from 'react';
import type { ProfileData, UserProfile, WalletIdentity } from '@/lib/profile/types';

export interface ProfileContextValue {
    profile: UserProfile | null;
    status: 'loading' | 'ready';
    storageKind: 'local' | 'supabase';
    saveProfile: (data: ProfileData) => Promise<UserProfile>;
    deleteProfile: () => Promise<void>;
    linkWallet: (wallet: WalletIdentity) => Promise<UserProfile>;
    unlinkWallet: () => Promise<UserProfile>;
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);
