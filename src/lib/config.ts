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
 *   VITE_GOOGLE_AUTH_ENABLED "true" | "false" — Google OAuth via Supabase (see README)
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

/** Supabase project credentials (public anon key only — never a service-role key). */
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** True when both Supabase env vars are present (see src/lib/supabase/client.ts). */
export const SUPABASE_CONFIGURED: boolean = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/**
 * Guest/demo mode is an explicit configuration switch.
 * Enabled by default during this foundation phase so the UI can be reviewed
 * in environments without wallet extensions — but once Supabase is configured
 * the app is a real product, so guest mode defaults to OFF and a wallet (or
 * Supabase session) is required. Set VITE_ENABLE_GUEST_MODE=false to require
 * a wallet connection for all app access; an explicit env value always wins.
 */
const guestEnv = import.meta.env.VITE_ENABLE_GUEST_MODE;
export const GUEST_MODE_ENABLED: boolean = guestEnv ? guestEnv === 'true' : !SUPABASE_CONFIGURED;

/**
 * Google sign-in (Supabase OAuth) is opt-in: it needs a Google OAuth client
 * configured in Google Cloud + Supabase (see README "Google sign-in"), and
 * VITE_GOOGLE_AUTH_ENABLED=true. Until then the button stays disabled with
 * an honest "Not set up yet" label. No Google credentials exist in the repo.
 */
export const GOOGLE_AUTH_ENABLED: boolean = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';

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
