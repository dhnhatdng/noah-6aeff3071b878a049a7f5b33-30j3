import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import type { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { KNOWN_GENESIS_HASHES, SOLANA_NETWORK } from '@/lib/config';

export type ClusterCheck =
    | { status: 'checking' }
    | { status: 'verified'; detected: WalletAdapterNetwork }
    | { status: 'mismatch'; detected: WalletAdapterNetwork }
    | { status: 'custom' }
    | { status: 'unreachable' };

const genesisCache = new Map<string, Promise<string>>();

/** How long the app waits for the RPC to answer before giving up. */
const GENESIS_TIMEOUT_MS = 8000;

/** localStorage cache so repeat visits resolve instantly. */
const CACHE_KEY = 'bc:v1:cluster-genesis';

interface CachedGenesis {
    endpoint: string;
    hash: string;
}

const readCachedHash = (endpoint: string): string | null => {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as CachedGenesis;
        return parsed && parsed.endpoint === endpoint && typeof parsed.hash === 'string' ? parsed.hash : null;
    } catch {
        return null;
    }
};

const writeCachedHash = (endpoint: string, hash: string): void => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ endpoint, hash }));
    } catch {
        // Private mode / blocked storage: the in-memory cache still works.
    }
};

const resolveHash = (hash: string): ClusterCheck => {
    const detected = KNOWN_GENESIS_HASHES[hash];
    if (!detected) return { status: 'custom' };
    if (detected === SOLANA_NETWORK) return { status: 'verified', detected };
    return { status: 'mismatch', detected };
};

/** Confirms which cluster the configured RPC actually serves, via its genesis hash. */
export const useClusterStatus = (): ClusterCheck => {
    const { connection } = useConnection();
    const [state, setState] = useState<ClusterCheck>(() => {
        // Repeat visits resolve instantly from the cached genesis hash.
        const cached = readCachedHash(connection.rpcEndpoint);
        return cached ? resolveHash(cached) : { status: 'checking' };
    });

    useEffect(() => {
        let active = true;
        const key = connection.rpcEndpoint;
        const cached = readCachedHash(key);
        if (cached) {
            setState(resolveHash(cached));
            return;
        }
        let request = genesisCache.get(key);
        if (!request) {
            // The public RPC can stall; time out instead of hanging on
            // "checking" forever.
            const timeout = new Promise<never>((_resolve, reject) =>
                window.setTimeout(() => reject(new Error('Genesis hash request timed out')), GENESIS_TIMEOUT_MS),
            );
            request = Promise.race([connection.getGenesisHash(), timeout]);
            genesisCache.set(key, request);
            request.catch(() => genesisCache.delete(key));
        }
        request
            .then((hash) => {
                if (!active) return;
                writeCachedHash(key, hash);
                setState(resolveHash(hash));
            })
            .catch(() => active && setState({ status: 'unreachable' }));
        return () => {
            active = false;
        };
    }, [connection]);

    return state;
};
