import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { GUEST_MODE_ENABLED } from '@/lib/config';
import { supabase } from '@/lib/supabase/client';
import { SessionContext, type OwnershipState, type SessionContextValue } from '@/lib/sessionContext';
import { authenticateWallet } from '@/lib/walletAuth';
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
    const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
    const wasConnected = useRef(connected);

    // Track a real (non-anonymous) Supabase Auth session — e.g. Google OAuth.
    // supabase-js exchanges the OAuth `code` in the URL automatically on
    // client init, and onAuthStateChange fires SIGNED_IN afterwards, so the
    // Login page only needs to watch this value to redirect after Google.
    useEffect(() => {
        if (!supabase) return;
        let mounted = true;
        const applySession = (user: { id: string; is_anonymous?: boolean } | null) => {
            if (mounted) setSupabaseUserId(user && !user.is_anonymous ? user.id : null);
        };
        supabase.auth.getSession().then(({ data: { session } }) => applySession(session?.user ?? null));
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => applySession(session?.user ?? null));
        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Reset ownership proof whenever the wallet address changes.
    useEffect(() => {
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
        if (!signMessage) {
            setOwnership({ status: 'error', message: 'This wallet does not support message signing.' });
            return;
        }
        setOwnership({ status: 'verifying' });
        try {
            // Client-side SIWS: the signature is verified in this browser and
            // the result is written to the Supabase profile row when one exists.
            // No session token is issued (see walletAuth.ts before relying on this).
            const { verifiedAt } = await authenticateWallet({ address, signMessage });
            setOwnership({ status: 'verified', address, verifiedAt });
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
            supabaseUserId,
            ownership,
            verifyOwnership,
            connectDialogOpen,
            setConnectDialogOpen,
        }),
        [walletError, setWalletError, isGuest, enterGuestMode, exitGuestMode, supabaseUserId, ownership, verifyOwnership, connectDialogOpen],
    );

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export default SessionProvider;
