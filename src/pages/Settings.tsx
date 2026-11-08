import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import StatusPill from '@/components/common/StatusPill';
import WalletStatusCard from '@/components/wallet/WalletStatusCard';
import OwnershipVerificationCard from '@/components/wallet/OwnershipVerificationCard';
import NetworkBadge from '@/components/wallet/NetworkBadge';
import ProfileDataCard from '@/components/profile/ProfileDataCard';
import WalletIdentityCard from '@/components/profile/WalletIdentityCard';
import { useClusterStatus } from '@/hooks/useClusterStatus';
import { useSession } from '@/hooks/useSession';
import { GOOGLE_AUTH_ENABLED, GUEST_MODE_ENABLED, NETWORK_LABELS, SOLANA_NETWORK, rpcHost } from '@/lib/config';

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium">{children}</dd>
    </div>
);

const NetworkCard = () => {
    const check = useClusterStatus();
    const rpcStatus = {
        checking: <StatusPill dot>Checking…</StatusPill>,
        verified: <StatusPill variant="success" dot>Verified via genesis hash</StatusPill>,
        mismatch: <StatusPill variant="danger" dot>Cluster mismatch</StatusPill>,
        custom: <StatusPill variant="warning" dot>Custom / local cluster</StatusPill>,
        unreachable: <StatusPill variant="warning" dot>Unreachable</StatusPill>,
    }[check.status];

    return (
        <SurfaceCard title="Network" description="The Solana cluster this app reads from." action={<NetworkBadge />}>
            <dl className="divide-y divide-border">
                <Row label="Configured cluster">{NETWORK_LABELS[SOLANA_NETWORK]}</Row>
                <Row label="RPC endpoint">
                    <span className="font-mono text-xs">{rpcHost()}</span>
                </Row>
                <Row label="RPC check">{rpcStatus}</Row>
            </dl>
            <p className="mt-4 rounded-xl bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                Devnet is the development default. Mainnet is enabled by setting <code className="font-mono">VITE_SOLANA_NETWORK=mainnet-beta</code>{' '}
                and a dedicated <code className="font-mono">VITE_SOLANA_RPC_URL</code>. Your wallet’s own network setting is
                managed inside Phantom or Solflare.
            </p>
        </SurfaceCard>
    );
};

const Settings = () => {
    const { isGuest, exitGuestMode } = useSession();
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-8">
            <PageHeader eyebrow="Settings" title="Wallet, network & account" description="Manage how you sign in and which network the app uses." />

            <section className="grid gap-6 lg:grid-cols-2">
                <WalletStatusCard />
                <OwnershipVerificationCard />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <NetworkCard />
                <div className="flex flex-col gap-6">
                    <SurfaceCard title="Sign-in methods">
                        <dl className="divide-y divide-border">
                            <Row label="Phantom / Solflare">
                                <StatusPill variant="success" dot>Enabled</StatusPill>
                            </Row>
                            <Row label="Google">
                                {GOOGLE_AUTH_ENABLED ? (
                                    <StatusPill variant="success" dot>Enabled</StatusPill>
                                ) : (
                                    <StatusPill dot>Requires backend</StatusPill>
                                )}
                            </Row>
                        </dl>
                    </SurfaceCard>
                    <SurfaceCard title="Session">
                        <dl className="divide-y divide-border">
                            <Row label="Guest demo mode">
                                {GUEST_MODE_ENABLED ? (
                                    <StatusPill variant="sage">Allowed by configuration</StatusPill>
                                ) : (
                                    <StatusPill>Disabled</StatusPill>
                                )}
                            </Row>
                            <Row label="Current session">{isGuest ? 'Guest (demo)' : 'Wallet'}</Row>
                        </dl>
                        {isGuest && (
                            <Button
                                variant="outline"
                                className="mt-4 self-start rounded-xl border-border"
                                onClick={() => {
                                    exitGuestMode();
                                    navigate('/login');
                                }}
                            >
                                Exit guest mode
                            </Button>
                        )}
                    </SurfaceCard>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <WalletIdentityCard />
                <ProfileDataCard />
            </section>
        </div>
    );
};

export default Settings;
