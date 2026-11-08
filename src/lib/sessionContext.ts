import { createContext } from 'react';

export type OwnershipStatus = 'unverified' | 'verifying' | 'verified' | 'error';

export interface OwnershipState {
    status: OwnershipStatus;
    message?: string;
}

export interface SessionContextValue {
    walletError: string | null;
    setWalletError: (message: string | null) => void;
    clearWalletError: () => void;
    isGuest: boolean;
    enterGuestMode: () => void;
    exitGuestMode: () => void;
    ownership: OwnershipState;
    verifyOwnership: () => Promise<void>;
    connectDialogOpen: boolean;
    setConnectDialogOpen: (open: boolean) => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
