import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { WalletError } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { SOLANA_NETWORK, SOLANA_RPC_ENDPOINT } from '@/lib/config';
import { describeWalletError } from '@/lib/wallet';
import { toast } from '@/hooks/use-toast';
import SessionProvider from './SessionProvider';

/**
 * Real Solana wallet integration via @solana/wallet-adapter.
 * Phantom and Solflare adapters are registered explicitly; Wallet Standard
 * wallets with the same name are de-duplicated by the adapter library.
 *
 * No autoConnect: reconnecting on page load made Solflare show a
 * full-screen promo, left every Connect button stuck on "Connecting…",
 * and surfaced a red wallet error before the user clicked anything.
 * Attendees connect explicitly instead — see ConnectAfterSelect below.
 */

/**
 * Connects after the user picks a wallet. The stock wallet modal only
 * calls select() and closes — it never connects on its own, and with
 * autoConnect off nothing else does either, so tapping a wallet did
 * nothing at all (reported from a phone on 2026-11-11).
 *
 * This fires only on a user pick, never on page load: it records the
 * wallet restored from storage on first render and connects when the
 * selection changes to a different wallet, or when the modal closes
 * with a wallet selected (covers re-tapping the same wallet).
 */
const ConnectAfterSelect = () => {
    const { wallet, connected, connecting, connect } = useWallet();
    const { visible } = useWalletModal();
    const initialNameRef = useRef<string | null | undefined>(undefined);
    if (initialNameRef.current === undefined) {
        initialNameRef.current = wallet?.adapter.name ?? null;
    }
    const prevVisibleRef = useRef(visible);
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const wasOpen = prevVisibleRef.current;
        prevVisibleRef.current = visible;
        if (!wallet || connected || connecting) return;
        const pickedDifferent = wallet.adapter.name !== initialNameRef.current;
        const modalJustClosed = wasOpen && !visible;
        if (!pickedDifferent && !modalJustClosed) return;
        let settled = false;
        // If the wallet never answers (e.g. its app/extension is not
        // installed, so the adapter opens an install page instead), the
        // connect promise never settles and the UI hangs on "Waiting for
        // wallet approval…". Nudge the user instead of hanging silently.
        const timer = setTimeout(() => {
            if (!settled && mountedRef.current) {
                toast({
                    title: 'Still waiting for wallet approval',
                    description: `If nothing opened, ${wallet.adapter.name} may not be installed on this device — install its app or extension, then try again.`,
                });
            }
        }, 20000);
        connect()
            .catch(() => {
                toast({
                    title: `Couldn't connect to ${wallet.adapter.name}`,
                    description: 'Make sure the wallet app is installed on this device, then try again.',
                });
            })
            .finally(() => {
                settled = true;
                clearTimeout(timer);
            });
        return () => clearTimeout(timer);
    }, [wallet, connected, connecting, visible, connect]);

    return null;
};
const SolanaProviders = ({ children }: { children: ReactNode }) => {
    const [walletError, setWalletError] = useState<string | null>(null);

    const wallets = useMemo(
        () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network: SOLANA_NETWORK })],
        [],
    );

    const onError = useCallback((error: WalletError) => {
        console.error('[wallet]', error);
        setWalletError(describeWalletError(error));
    }, []);

    return (
        <ConnectionProvider endpoint={SOLANA_RPC_ENDPOINT}>
            <WalletProvider wallets={wallets} onError={onError}>
                <WalletModalProvider>
                    <ConnectAfterSelect />
                    <SessionProvider walletError={walletError} setWalletError={setWalletError}>
                        {children}
                    </SessionProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default SolanaProviders;
