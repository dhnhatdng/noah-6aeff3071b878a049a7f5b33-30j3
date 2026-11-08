import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { GUEST_MODE_ENABLED } from '@/lib/config';
import { SessionContext, type OwnershipState, type SessionContextValue } from '@/lib/sessionContext';
import { authenticateWallet, isBackendAuthConfigured } from '@/lib/walletAuth';
import { shortenAddress } from '@/lib/wallet';
import { toast } from '@/hooks/use-toast';

const GUEST_KEY = 'bc:guest-mode';

interface SessionProviderProps {
    children: ReactNode;
    walletError: string | null;
    setWalletError: (message: string | null) => void;
}

const SessionProvider = ({ children, walletError, setWalletError }: SessionProviderProps) => {
    const { publicKey, connected, signMessage, wallet } = useWallet();
    const address = publicKey?.toBase58() ?? null;

    const [isGuest, setIsGuest] = useState<boolean>(
        () => GUEST_MODE_ENABLED && sessionStorage.getItem(GUEST_KEY) === '1',
    );
    const [ownership, setOwnership] = useState<OwnershipState>({ status: 'unverified' });
    const [connectDialogOpen, setConnectDialogOpen] = useState(false);
    // In-memory only — session tokens must never be persisted to localStorage.
    const sessionTokenRef = useRef<string | null>(null);
    const wasConnected = useRef(connected);

    // Reset ownership proof whenever the wallet address changes.
    useEffect(() => {
        sessionTokenRef.current = null;
        setOwnership({ status: 'unverified' });
    }, [address]);

    // Real connection state transitions -> feedback + leave guest mode.
    useEffect(() => {
        if (connected && !wasConnected.current) {
            setWalletError(null);
            if (isGuest) {
                sessionStorage.removeItem(GUEST_KEY);
                setIsGuest(false);
            }
            toast({
                title: `Connected to ${wallet?.adapter.name ?? 'wallet'}`,
                description: address ? shortenAddress(address, 6) : undefined,
            });
        }
        wasConnected.current = connected;
    }, [connected, isGuest, wallet, address, setWalletError]);

    const enterGuestMode = useCallback(() => {
        if (!GUEST_MODE_ENABLED) return;
        sessionStorage.setItem(GUEST_KEY, '1');
        setIsGuest(true);
    }, []);

    const exitGuestMode = useCallback(() => {
        sessionStorage.removeItem(GUEST_KEY);
        setIsGuest(false);
    }, []);

    const verifyOwnership = useCallback(async () => {
        if (!address) {
            setOwnership({ status: 'error', message: 'Connect a wallet first.' });
            return;
        }
        if (!isBackendAuthConfigured()) {
            setOwnership({
                status: 'error',
                message: 'The verification backend is not configured yet, so ownership cannot be proven.',
            });
            return;
        }
        if (!signMessage) {
            setOwnership({ status: 'error', message: 'This wallet does not support message signing.' });
            return;
        }
        setOwnership({ status: 'verifying' });
        try {
            const { token } = await authenticateWallet({ address, signMessage });
            sessionTokenRef.current = token;
            setOwnership({ status: 'verified' });
        } catch (error) {
            setOwnership({
                status: 'error',
                message: error instanceof Error ? error.message : 'Verification failed.',
            });
        }
    }, [address, signMessage]);

    const value = useMemo<SessionContextValue>(
        () => ({
            walletError,
            setWalletError,
            clearWalletError: () => setWalletError(null),
            isGuest,
            enterGuestMode,
            exitGuestMode,
            ownership,
            verifyOwnership,
            connectDialogOpen,
            setConnectDialogOpen,
        }),
        [walletError, setWalletError, isGuest, enterGuestMode, exitGuestMode, ownership, verifyOwnership, connectDialogOpen],
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export default SessionProvider;
