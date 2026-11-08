import { useCallback, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState, type WalletName } from '@solana/wallet-adapter-base';
import { SUPPORTED_WALLETS, isWalletUsable, type SupportedWalletName } from '@/lib/wallet';
import { useSession } from './useSession';
import { toast } from './use-toast';

export interface WalletOption {
    name: SupportedWalletName;
    installUrl: string;
    icon?: string;
    readyState: WalletReadyState;
}

/** Wallet connection helpers built on the real wallet adapter state. */
export const useWalletConnect = () => {
    const { wallets, wallet, select, connect, disconnect, connected, connecting, disconnecting, publicKey } =
        useWallet();
    const { clearWalletError, setWalletError } = useSession();

    const options = useMemo<WalletOption[]>(
        () =>
            SUPPORTED_WALLETS.map((supported) => {
                const match = wallets.find((w) => w.adapter.name === supported.name);
                return {
                    name: supported.name,
                    installUrl: supported.installUrl,
                    icon: match?.adapter.icon,
                    readyState: match?.readyState ?? WalletReadyState.NotDetected,
                };
            }),
        [wallets],
    );

    const connectTo = useCallback(
        async (name: SupportedWalletName) => {
            clearWalletError();
            const option = options.find((o) => o.name === name);
            if (!option || !isWalletUsable(option.readyState)) {
                setWalletError(`${name} wasn’t detected in this browser. Install it, then refresh this page.`);
                return;
            }
            // Same wallet already selected (e.g. after a declined request) -> request again directly.
            if (wallet?.adapter.name === name) {
                try {
                    await connect();
                } catch {
                    /* surfaced through WalletProvider onError */
                }
                return;
            }
            // Selecting a wallet triggers the adapter's approval prompt (autoConnect on user selection).
            select(name as WalletName);
        },
        [options, wallet, connect, select, clearWalletError, setWalletError],
    );

    const disconnectWallet = useCallback(async () => {
        try {
            await disconnect();
            toast({ title: 'Wallet disconnected' });
        } catch {
            /* surfaced through WalletProvider onError */
        }
    }, [disconnect]);

    return {
        options,
        connectTo,
        disconnectWallet,
        connected,
        connecting,
        disconnecting,
        address: publicKey?.toBase58() ?? null,
        walletName: wallet?.adapter.name ?? null,
        walletIcon: wallet?.adapter.icon,
        connectingName: connecting ? (wallet?.adapter.name ?? null) : null,
    };
};
