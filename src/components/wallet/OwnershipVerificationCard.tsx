import { CheckCircle2, Circle, Clock, KeyRound, Loader2 } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import SurfaceCard from '@/components/common/SurfaceCard';
import StatusPill from '@/components/common/StatusPill';
import { useSession } from '@/hooks/useSession';
import { authenticateWallet } from '@/lib/walletAuth';
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

    const steps: { label: string; detail: string; state: StepState }[] = [
        {
            label: 'Sign-in message (SIWS format)',
            detail: 'Address, one-time nonce and chain — no transaction, no fees.',
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
            label: 'Local nonce (one-time, stored in this browser)',
            detail: 'A fresh nonce is issued per attempt and consumed after use, so a signature cannot be replayed.',
            state: 'ready',
        },
        {
            label: 'Client-side signature check (Ed25519)',
            detail:
                ownership.status === 'verified'
                    ? 'Signature verified against the wallet public key.'
                    : 'Verified in this browser. A production deployment should move this check server-side.',
            state: ownership.status === 'verified' ? 'ready' : 'pending',
        },
    ];

    const statusPill =
        ownership.status === 'verified' ? (
            <StatusPill variant="success" dot>Verified</StatusPill>
        ) : (
            <StatusPill variant="neutral" dot>Not verified</StatusPill>
        );

    return (
        <SurfaceCard
            title="Proof of ownership"
            description="Connecting shares your address. Ownership is proven only by signing a one-time nonce — checked in this browser; a production deployment should verify server-side."
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

            {ownership.status === 'verified' && ownership.address && (
                <p className="mt-4 rounded-xl bg-success-soft px-3 py-2 text-xs text-success">
                    Verified {ownership.address}
                    {ownership.verifiedAt && (
                        <>
                            {' '}
                            · {new Date(ownership.verifiedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </>
                    )}
                </p>
            )}

            <Button
                onClick={verifyOwnership}
                disabled={!connected || !signMessage || ownership.status === 'verifying' || ownership.status === 'verified'}
                className={cn('mt-5 rounded-xl')}
            >
                {ownership.status === 'verifying' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <KeyRound className="h-4 w-4" />
                )}
                {ownership.status === 'verifying' ? 'Waiting for signature…' : 'Sign & verify ownership'}
            </Button>
            {!connected && (
                <p className="mt-2 text-xs text-muted-foreground">Connect a wallet first to verify ownership.</p>
            )}
            {connected && !signMessage && (
                <p className="mt-2 text-xs text-muted-foreground">
                    This wallet does not support message signing, so ownership cannot be verified.
                </p>
            )}
        </SurfaceCard>
    );
};

export default OwnershipVerificationCard;
