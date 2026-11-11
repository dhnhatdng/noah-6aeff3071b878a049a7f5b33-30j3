import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import type { WalletError } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { SOLANA_NETWORK, SOLANA_RPC_ENDPOINT } from '@/lib/config';
import { describeWalletError } from '@/lib/wallet';
import SessionProvider from './SessionProvider';

/**
 * Real Solana wallet integration via @solana/wallet-adapter.
 * Phantom and Solflare adapters are registered explicitly; Wallet Standard
 * wallets with the same name are de-duplicated by the adapter library.
 *
 * No autoConnect: reconnecting on page load made Solflare show a
 * full-screen promo, left every Connect button stuck on "Connecting…",
 * and surfaced a red wallet error before the user clicked anything.
 * Attendees connect explicitly instead.
 */
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
                    <SessionProvider walletError={walletError} setWalletError={setWalletError}>
                        {children}
                    </SessionProvider>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default SolanaProviders;
