import { Loader2, LogOut, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SurfaceCard from '@/components/common/SurfaceCard';
import StatusPill from '@/components/common/StatusPill';
import EmptyState from '@/components/common/EmptyState';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { useSession } from '@/hooks/useSession';
import { NETWORK_LABELS, SOLANA_NETWORK } from '@/lib/config';
import WalletIcon from './WalletIcon';
import AddressDisplay from './AddressDisplay';

const ownershipPill = {
    unverified: { variant: 'warning', label: 'Not verified' },
    verifying: { variant: 'sage', label: 'Verifying…' },
    verified: { variant: 'success', label: 'Verified' },
    error: { variant: 'danger', label: 'Not verified' },
} as const;

const WalletStatusCard = ({ className }: { className?: string }) => {
    const { connected, connecting, disconnecting, address, walletName, walletIcon, disconnectWallet } =
        useWalletConnect();
    const { setConnectDialogOpen, isGuest, ownership } = useSession();

    if (!connected || !address) {
        return (
            <SurfaceCard title="Wallet" description="Your wallet is your identity on Breakpoint Connect." className={className}>
                <EmptyState
                    compact
                    icon={Wallet}
                    title={connecting ? 'Waiting for wallet approval…' : 'No wallet connected'}
                    description={
                        isGuest
                            ? 'You’re in guest demo mode. Connect Phantom or Solflare to use your real identity.'
                            : 'Connect Phantom or Solflare to continue.'
                    }
                    action={
                        <Button onClick={() => setConnectDialogOpen(true)} disabled={connecting} className="rounded-xl">
                            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                            {connecting ? 'Connecting…' : 'Connect wallet'}
                        </Button>
                    }
                />
            </SurfaceCard>
        );
    }

    const pill = ownershipPill[ownership.status];

    return (
        <SurfaceCard
            title="Wallet"
            description="Connected — public address shared with the app."
            action={
                <StatusPill variant="success" dot>
                    Connected
                </StatusPill>
            }
            className={className}
        >
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <WalletIcon name={walletName ?? 'W'} icon={walletIcon} className="h-10 w-10" />
                    <div>
                        <p className="font-medium">{walletName}</p>
                        <p className="text-xs text-muted-foreground">Solana wallet</p>
                    </div>
                </div>
                <AddressDisplay address={address} />
                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-secondary/60 px-3 py-2.5">
                        <dt className="text-xs text-muted-foreground">App network</dt>
                        <dd className="mt-0.5 font-medium">{NETWORK_LABELS[SOLANA_NETWORK]}</dd>
                    </div>
                    <div className="rounded-xl bg-secondary/60 px-3 py-2.5">
                        <dt className="text-xs text-muted-foreground">Ownership</dt>
                        <dd className="mt-1">
                            <StatusPill variant={pill.variant}>{pill.label}</StatusPill>
                        </dd>
                    </div>
                </dl>
                <Button
                    variant="outline"
                    onClick={disconnectWallet}
                    disabled={disconnecting}
                    className="rounded-xl border-border text-destructive hover:bg-destructive-soft hover:text-destructive"
                >
                    {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                    Disconnect
                </Button>
            </div>
        </SurfaceCard>
    );
};

export default WalletStatusCard;
