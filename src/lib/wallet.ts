import {
    WalletConnectionError,
    WalletNotReadyError,
    WalletReadyState,
    WalletWindowClosedError,
    type WalletError,
} from '@solana/wallet-adapter-base';

export const SUPPORTED_WALLETS = [
    { name: 'Phantom', installUrl: 'https://phantom.com/download' },
    { name: 'Solflare', installUrl: 'https://solflare.com/download' },
] as const;

export type SupportedWalletName = (typeof SUPPORTED_WALLETS)[number]['name'];

export const shortenAddress = (address: string, chars = 4): string =>
    address.length <= chars * 2 + 1 ? address : `${address.slice(0, chars)}…${address.slice(-chars)}`;

export const readyStateLabel = (state: WalletReadyState): string => {
    switch (state) {
        case WalletReadyState.Installed:
            return 'Detected';
        case WalletReadyState.Loadable:
            return 'Available';
        case WalletReadyState.Unsupported:
            return 'Unsupported';
        default:
            return 'Not installed';
    }
};

export const isWalletUsable = (state: WalletReadyState): boolean =>
    state === WalletReadyState.Installed || state === WalletReadyState.Loadable;

/** Converts adapter errors into short, human-readable messages. */
export const describeWalletError = (error: WalletError): string => {
    const raw = `${error.message ?? ''} ${(error.error as Error | undefined)?.message ?? ''}`.toLowerCase();

    if (error instanceof WalletNotReadyError) {
        return 'Wallet not detected. Install the extension, or open this page in the wallet’s in-app browser.';
    }
    if (raw.includes('reject') || raw.includes('denied') || raw.includes('declined') || raw.includes('cancel')) {
        return 'The request was declined in your wallet. No connection was made.';
    }
    if (error instanceof WalletWindowClosedError) {
        return 'The wallet window was closed before approval.';
    }
    if (error instanceof WalletConnectionError) {
        return 'The wallet could not connect. Unlock it and try again.';
    }
    return error.message || 'Unexpected wallet error. Please try again.';
};
