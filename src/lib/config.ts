import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

/**
 * Central runtime configuration for Breakpoint Connect.
 * Everything environment-specific is driven by Vite env vars so that
 * switching Devnet -> Mainnet requires no code changes.
 *
 *   VITE_SOLANA_NETWORK     devnet (default) | testnet | mainnet-beta
 *   VITE_SOLANA_RPC_URL     optional custom RPC (recommended for mainnet)
 *   VITE_AUTH_API_URL       base URL of the nonce/verify auth backend (pending)
 *   VITE_ENABLE_GUEST_MODE  "true" | "false" — explicit guest/demo access
 */

export const APP_NAME = 'Breakpoint Connect';

const parseNetwork = (value?: string): WalletAdapterNetwork => {
    switch (value) {
        case 'mainnet':
        case 'mainnet-beta':
            return WalletAdapterNetwork.Mainnet;
        case 'testnet':
            return WalletAdapterNetwork.Testnet;
        default:
            return WalletAdapterNetwork.Devnet;
    }
};

export const SOLANA_NETWORK: WalletAdapterNetwork = parseNetwork(import.meta.env.VITE_SOLANA_NETWORK);

export const SOLANA_RPC_ENDPOINT: string = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK);

export const NETWORK_LABELS: Record<WalletAdapterNetwork, string> = {
    [WalletAdapterNetwork.Mainnet]: 'Mainnet',
    [WalletAdapterNetwork.Devnet]: 'Devnet',
    [WalletAdapterNetwork.Testnet]: 'Testnet',
};

/** Genesis hashes let us verify which cluster the RPC endpoint actually serves. */
export const KNOWN_GENESIS_HASHES: Record<string, WalletAdapterNetwork> = {
    '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d': WalletAdapterNetwork.Mainnet,
    EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG: WalletAdapterNetwork.Devnet,
    '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY': WalletAdapterNetwork.Testnet,
};

/** CAIP-style chain id used in the sign-in message. */
export const SOLANA_CHAIN_ID = `solana:${SOLANA_NETWORK === WalletAdapterNetwork.Mainnet ? 'mainnet' : SOLANA_NETWORK}`;

/** Auth backend for nonce issuance + signature verification. Empty = not configured. */
export const AUTH_API_URL: string = (import.meta.env.VITE_AUTH_API_URL || '').replace(/\/$/, '');

/**
 * Guest/demo mode is an explicit configuration switch.
 * Enabled by default during this foundation phase so the UI can be reviewed
 * in environments without wallet extensions. Set VITE_ENABLE_GUEST_MODE=false
 * to require a wallet connection for all app access.
 */
const guestEnv = import.meta.env.VITE_ENABLE_GUEST_MODE;
export const GUEST_MODE_ENABLED: boolean = guestEnv ? guestEnv === 'true' : true;

/** Google sign-in requires a connected auth backend (e.g. Supabase). Not yet configured. */
export const GOOGLE_AUTH_ENABLED = false;

export const explorerAddressUrl = (address: string): string => {
    const cluster = SOLANA_NETWORK === WalletAdapterNetwork.Mainnet ? '' : `?cluster=${SOLANA_NETWORK}`;
    return `https://explorer.solana.com/address/${address}${cluster}`;
};

export const rpcHost = (): string => {
    try {
        return new URL(SOLANA_RPC_ENDPOINT).host;
    } catch {
        return SOLANA_RPC_ENDPOINT;
    }
};
