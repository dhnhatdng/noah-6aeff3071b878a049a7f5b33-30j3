import { createContext } from 'react';

export type OwnershipStatus = 'unverified' | 'verifying' | 'verified' | 'error';

export interface OwnershipState {
    status: OwnershipStatus;
    message?: string;
    /** Wallet address proven by signature (client-side SIWS; see walletAuth.ts). */
    address?: string;
    /** ISO timestamp of the successful verification. */
    verifiedAt?: string;
}

export interface SessionContextValue {
    walletError: string | null;
    setWalletError: (message: string | null) => void;
    clearWalletError: () => void;
    isGuest: boolean;
    enterGuestMode: () => void;
    exitGuestMode: () => void;
    /**
     * Id of the signed-in Supabase Auth user, when the session belongs to a
     * real (non-anonymous) identity — e.g. Google OAuth. Null otherwise.
     * Anonymous sessions do NOT count: they are created implicitly by the
     * data layer and must never open the app on their own.
     */
    supabaseUserId: string | null;
    /**
     * How the current session was established, for display only.
     * 'google' — real Supabase user whose provider is Google; 'wallet' —
     * a connected Solana wallet; 'guest' — explicit guest/demo mode;
     * 'other' — a real Supabase user via another provider; null — no
     * signed-in session. Never invent a more specific label than this.
     */
    signInMethod: 'guest' | 'google' | 'wallet' | 'other' | null;
    /** Full sign-out: Supabase session + wallet + guest state, then /login. */
    signOut: () => Promise<void>;
    ownership: OwnershipState;
    verifyOwnership: () => Promise<void>;
    connectDialogOpen: boolean;
    setConnectDialogOpen: (open: boolean) => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
