import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { KeyRound, Link2, Loader2, Unlink, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SurfaceCard from '@/components/common/SurfaceCard';
import StatusPill from '@/components/common/StatusPill';
import EmptyState from '@/components/common/EmptyState';
import AddressDisplay from '@/components/wallet/AddressDisplay';
import WalletIcon from '@/components/wallet/WalletIcon';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { toast } from '@/hooks/use-toast';
import { NETWORK_LABELS, SOLANA_NETWORK } from '@/lib/config';
import { shortenAddress } from '@/lib/wallet';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex items-center justify-between gap-3 py-2.5">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="text-right text-sm font-medium">{children}</dd>
    </div>
);

const networkLabel = (network: string) => NETWORK_LABELS[network as WalletAdapterNetwork] ?? network;

/**
 * Wallet identity on the profile. Linking stores the public address as a claim;
 * it is never shown as verified unless ownership was proven in this session.
 */
const WalletIdentityCard = ({ className }: { className?: string }) => {
    const { profile, linkWallet, unlinkWallet } = useProfile();
    const { connected, connecting, address, walletName, walletIcon } = useWalletConnect();
    const { setConnectDialogOpen, ownership } = useSession();
    const [busy, setBusy] = useState(false);

    const linked = profile?.wallet ?? null;
    const linkedIsConnected = Boolean(linked && connected && address === linked.address);
    const otherConnected = Boolean(linked && connected && address && address !== linked.address);
    const verified = linkedIsConnected && ownership.status === 'verified';

    const run = async (action: () => Promise<unknown>, success: string, description?: string) => {
        setBusy(true);
        try {
            await action();
            toast({ title: success, description });
        } catch (err) {
            toast({
                title: 'Wallet link not updated',
                description: err instanceof Error ? err.message : 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setBusy(false);
        }
    };

    const link = () => {
        if (!address || !walletName) return;
        void run(
            () => linkWallet({ address, provider: walletName, network: SOLANA_NETWORK, linkedAt: new Date().toISOString() }),
            'Wallet linked to profile',
            'Shown as unverified until ownership is proven.',
        );
    };

    const connectButton = (
        <Button onClick={() => setConnectDialogOpen(true)} disabled={connecting} className="rounded-xl">
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            {connecting ? 'Connecting…' : 'Connect wallet'}
        </Button>
    );

    if (!profile) {
        return (
            <SurfaceCard title="Wallet identity" description="Link a wallet to your profile." className={className}>
                <EmptyState
                    compact
                    icon={Wallet}
                    title="Create your profile first"
                    description={
                        connected && address
                            ? `${walletName} · ${shortenAddress(address)} is connected and can be linked once your profile exists.`
                            : 'You can link a Solana wallet after creating your profile.'
                    }
                />
            </SurfaceCard>
        );
    }

    if (!linked) {
        return (
            <SurfaceCard
                title="Wallet identity"
                description="Optional. Links your public address to this profile."
                action={<StatusPill dot>Not linked</StatusPill>}
                className={className}
            >
                {connected && address ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <WalletIcon name={walletName ?? 'W'} icon={walletIcon} className="h-10 w-10" />
                            <div className="min-w-0">
                                <p className="font-medium">{walletName} connected</p>
                                <p className="truncate font-mono text-xs text-muted-foreground">{shortenAddress(address, 6)}</p>
                            </div>
                        </div>
                        <Button onClick={link} disabled={busy} className="rounded-xl">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                            Link {walletName} to profile
                        </Button>
                    </div>
                ) : (
                    <EmptyState compact icon={Wallet} title="No wallet connected" description="Connect Phantom or Solflare to link it." action={connectButton} />
                )}
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                    Linking stores your public address only. It is not proof of ownership.
                </p>
            </SurfaceCard>
        );
    }

    return (
        <SurfaceCard
            title="Wallet identity"
            description="Linked to your profile."
            action={verified ? <StatusPill variant="success" dot>Verified</StatusPill> : <StatusPill variant="warning" dot>Unverified</StatusPill>}
            className={className}
        >
            <div className="flex flex-col gap-3">
                <AddressDisplay address={linked.address} />
                <dl className="divide-y divide-border">
                    <Row label="Provider">{linked.provider}</Row>
                    <Row label="Connection">
                        {linkedIsConnected ? (
                            <StatusPill variant="success" dot>Connected</StatusPill>
                        ) : otherConnected ? (
                            <StatusPill variant="warning" dot>Different wallet connected</StatusPill>
                        ) : (
                            <StatusPill dot>Not connected</StatusPill>
                        )}
                    </Row>
                    <Row label="Network">
                        {networkLabel(linked.network)}
                        {linked.network !== SOLANA_NETWORK && (
                            <span className="ml-1 text-xs text-warning">(app is on {networkLabel(SOLANA_NETWORK)})</span>
                        )}
                    </Row>
                    <Row label="Ownership">
                        {verified ? 'Verified this session' : 'Not verified'}
                    </Row>
                    <Row label="Linked">{new Date(linked.linkedAt).toLocaleDateString()}</Row>
                </dl>
                {!verified && (
                    <p className="rounded-xl bg-warning-soft px-3 py-2.5 text-xs leading-relaxed text-warning">
                        This address is a claim, not proven ownership. Verification needs a signed nonce checked by the
                        backend, which is not connected yet.
                    </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                    {!connected && connectButton}
                    {otherConnected && (
                        <Button onClick={link} disabled={busy} className="rounded-xl">
                            <Link2 className="h-4 w-4" /> Link {walletName} instead
                        </Button>
                    )}
                    {linkedIsConnected && !verified && (
                        <Button asChild variant="outline" className="rounded-xl border-border">
                            <Link to="/settings">
                                <KeyRound className="h-4 w-4" /> Verify ownership
                            </Link>
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void run(unlinkWallet, 'Wallet unlinked from profile')}
                        className="rounded-xl border-border text-destructive hover:bg-destructive-soft hover:text-destructive"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
                        Unlink
                    </Button>
                </div>
            </div>
        </SurfaceCard>
    );
};

export default WalletIdentityCard;
