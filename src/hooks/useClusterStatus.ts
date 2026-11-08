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

/** Confirms which cluster the configured RPC actually serves, via its genesis hash. */
export const useClusterStatus = (): ClusterCheck => {
    const { connection } = useConnection();
    const [state, setState] = useState<ClusterCheck>({ status: 'checking' });

    useEffect(() => {
        let active = true;
        const key = connection.rpcEndpoint;
        let request = genesisCache.get(key);
        if (!request) {
            request = connection.getGenesisHash();
            genesisCache.set(key, request);
            request.catch(() => genesisCache.delete(key));
        }
        request
            .then((hash) => {
                if (!active) return;
                const detected = KNOWN_GENESIS_HASHES[hash];
                if (!detected) setState({ status: 'custom' });
                else if (detected === SOLANA_NETWORK) setState({ status: 'verified', detected });
                else setState({ status: 'mismatch', detected });
            })
            .catch(() => active && setState({ status: 'unreachable' }));
        return () => {
            active = false;
        };
    }, [connection]);

    return state;
};
