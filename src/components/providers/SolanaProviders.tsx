import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import type { WalletError } from '@solana/wallet-adapter-base';
import { WalletReadyState } from '@solana/wallet-adapter-base';
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
        // An explicit tap always tries to connect, so a missing wallet
        // shows the install guidance. But a bare modal close must only
        // auto-connect when the wallet is actually present (Installed /
        // Loadable — the Mobile Wallet Adapter reports Loadable): without
        // this, a stale stored selection makes the app flash a
        // "Couldn't connect" error for a wallet the user never picked
        // (observed on production 2026-11-11 when the modal was closed
        // without choosing anything).
        const connectable =
            wallet.adapter.readyState === WalletReadyState.Installed ||
            wallet.adapter.readyState === WalletReadyState.Loadable;
        if (!pickedDifferent && !(modalJustClosed && connectable)) return;
        connect().catch(() => {
            toast({
                title: `Couldn't connect to ${wallet.adapter.name}`,
                description: 'Make sure the wallet app is installed on this device, then try again.',
            });
        });
    }, [wallet, connected, connecting, visible, connect]);

    // If the wallet never answers (e.g. its app/extension is not
    // installed, so the adapter opens an install page instead), the
    // connect promise never settles and the UI hangs on "Waiting for
    // wallet approval…". Nudge the user instead of hanging silently.
    // Separate effect: the connect effect above re-runs and clears its
    // cleanup when `connecting` flips, which used to kill this timer
    // before it ever fired (observed 2026-11-11).
    useEffect(() => {
        if (!connecting || !wallet) return;
        const timer = setTimeout(() => {
            if (mountedRef.current) {
                toast({
                    title: 'Still waiting for wallet approval',
                    description: `If nothing opened, ${wallet.adapter.name} may not be installed on this device — install its app or extension, then try again.`,
                });
            }
        }, 20000);
        return () => clearTimeout(timer);
    }, [connecting, wallet]);

    return null;
};
const SolanaProviders = ({ children }: { children: ReactNode }) => {
    const [walletError, setWalletError] = useState<string | null>(null);

    // The Phantom adapter has no path to the installed app on Android
    // Chrome: it only connects via an injected provider (desktop
    // extension / in-app browser) or via its iOS-only universal-link
    // redirect, so on Android tapping "Phantom" always fails with a
    // misleading "not installed" error (reported from a phone on
    // 2026-11-11). Hide it on Android — Phantom is still reachable
    // there through the "Mobile Wallet Adapter" row, which is backed
    // by the Wallet Standard mobile wallet. Keep Phantom on iOS (the
    // universal-link redirect works there) and on desktop (extension).
    const isAndroid =
        typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

    const wallets = useMemo(
        () => [
            ...(isAndroid ? [] : [new PhantomWalletAdapter()]),
            new SolflareWalletAdapter({ network: SOLANA_NETWORK }),
        ],
        // isAndroid is read once from the user agent; it never changes
        // for the lifetime of the page.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
