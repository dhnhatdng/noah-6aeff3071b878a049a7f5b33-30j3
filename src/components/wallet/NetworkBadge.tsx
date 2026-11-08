import { NETWORK_LABELS, SOLANA_NETWORK } from '@/lib/config';
import { useClusterStatus } from '@/hooks/useClusterStatus';
import { cn } from '@/lib/utils';

interface NetworkBadgeProps {
    className?: string;
}

/** Shows the cluster the app is configured for, verified against the RPC genesis hash. */
const NetworkBadge = ({ className }: NetworkBadgeProps) => {
    const check = useClusterStatus();
    const label = NETWORK_LABELS[SOLANA_NETWORK];

    const meta = {
        checking: { dot: 'bg-muted-foreground animate-pulse', suffix: '', title: 'Checking RPC cluster…' },
        verified: { dot: 'bg-success', suffix: '', title: `RPC verified as ${label}` },
        mismatch: {
            dot: 'bg-destructive',
            suffix: ' · mismatch',
            title:
                check.status === 'mismatch'
                    ? `Configured for ${label}, but RPC serves ${NETWORK_LABELS[check.detected]}`
                    : '',
        },
        custom: { dot: 'bg-warning', suffix: ' · custom RPC', title: 'RPC genesis hash is not a public cluster' },
        unreachable: { dot: 'bg-warning', suffix: ' · offline', title: 'RPC endpoint unreachable' },
    }[check.status];

    return (
        <span
            title={`${meta.title}. The app uses this cluster; your wallet's own network setting is managed inside the wallet.`}
            className={cn(
                'inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground',
                className,
            )}
        >
            <span className={cn('h-2 w-2 rounded-full', meta.dot)} aria-hidden />
            <span>
                {label}
                <span className="text-muted-foreground">{meta.suffix}</span>
            </span>
        </span>
    );
};

export default NetworkBadge;
