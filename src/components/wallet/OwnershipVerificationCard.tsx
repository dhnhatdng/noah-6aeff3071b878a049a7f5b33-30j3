import { CheckCircle2, Circle, Clock, KeyRound, Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import SurfaceCard from '@/components/common/SurfaceCard';
import StatusPill from '@/components/common/StatusPill';
import { useSession } from '@/hooks/useSession';
import { isBackendAuthConfigured } from '@/lib/walletAuth';
import { cn } from '@/lib/utils';

type StepState = 'ready' | 'pending' | 'waiting';

const StepIcon = ({ state }: { state: StepState }) =>
    state === 'ready' ? (
        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
    ) : state === 'pending' ? (
        <Clock className="h-4 w-4 text-warning" aria-hidden />
    ) : (
        <Circle className="h-4 w-4 text-muted-foreground" aria-hidden />
    );

const OwnershipVerificationCard = ({ className }: { className?: string }) => {
    const { connected, signMessage } = useWallet();
    const { ownership, verifyOwnership } = useSession();
    const backendReady = isBackendAuthConfigured();

    const steps: { label: string; detail: string; state: StepState }[] = [
        {
            label: 'Sign-in message (SIWS format)',
            detail: 'Domain, address, chain, nonce and expiry — no transaction, no fees.',
            state: 'ready',
        },
        {
            label: 'Wallet message signing',
            detail: connected
                ? signMessage
                    ? 'Your connected wallet supports message signing.'
                    : 'Your connected wallet does not support message signing.'
                : 'Checked once a wallet is connected.',
            state: connected ? (signMessage ? 'ready' : 'pending') : 'waiting',
        },
        {
            label: 'Nonce issuance endpoint',
            detail: backendReady ? 'Configured.' : 'Pending — requires an auth backend.',
            state: backendReady ? 'ready' : 'pending',
        },
        {
            label: 'Server signature verification & session',
            detail: backendReady ? 'Configured.' : 'Pending — requires an auth backend.',
            state: backendReady ? 'ready' : 'pending',
        },
    ];

    const statusPill =
        ownership.status === 'verified' ? (
            <StatusPill variant="success" dot>Verified</StatusPill>
        ) : backendReady ? (
            <StatusPill variant="warning" dot>Not verified</StatusPill>
        ) : (
            <StatusPill variant="neutral" dot>Backend pending</StatusPill>
        );

    return (
        <SurfaceCard
            title="Proof of ownership"
            description="Connecting shares your address. Ownership is proven only by signing a server-issued nonce."
            action={statusPill}
            className={className}
        >
            <ul className="flex flex-col gap-3">
                {steps.map((step) => (
                    <li key={step.label} className="flex gap-3">
                        <span className="mt-0.5">
                            <StepIcon state={step.state} />
                        </span>
                        <span>
                            <span className="block text-sm font-medium">{step.label}</span>
                            <span className="block text-xs text-muted-foreground">{step.detail}</span>
                        </span>
                    </li>
                ))}
            </ul>

            {ownership.status === 'error' && ownership.message && (
                <p role="alert" className="mt-4 rounded-xl bg-destructive-soft px-3 py-2 text-xs text-destructive">
                    {ownership.message}
                </p>
            )}

            <Button
                onClick={verifyOwnership}
                disabled={!connected || !backendReady || ownership.status === 'verifying' || ownership.status === 'verified'}
                className={cn('mt-5 rounded-xl')}
            >
                {ownership.status === 'verifying' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <KeyRound className="h-4 w-4" />
                )}
                {ownership.status === 'verifying' ? 'Waiting for signature…' : 'Sign & verify ownership'}
            </Button>
            {!backendReady && (
                <p className="mt-2 text-xs text-muted-foreground">
                    Verification is disabled until the backend nonce and verify endpoints are connected.
                </p>
            )}
        </SurfaceCard>
    );
};

export default OwnershipVerificationCard;
