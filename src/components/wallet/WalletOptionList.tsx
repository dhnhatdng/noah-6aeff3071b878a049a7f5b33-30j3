import { AlertCircle, ArrowUpRight, Loader2, X } from 'lucide-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWalletConnect, type WalletOption } from '@/hooks/useWalletConnect';
import { useSession } from '@/hooks/useSession';
import { isWalletUsable, readyStateLabel } from '@/lib/wallet';
import { cn } from '@/lib/utils';
import StatusPill from '@/components/common/StatusPill';
import WalletIcon from './WalletIcon';

const rowClass =
    'group flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-all duration-200 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const WalletRow = ({
    option,
    isConnecting,
    disabled,
    onConnect,
}: {
    option: WalletOption;
    isConnecting: boolean;
    disabled: boolean;
    onConnect: () => void;
}) => {
    const usable = isWalletUsable(option.readyState);
    const pill = (
        <StatusPill variant={option.readyState === WalletReadyState.Installed ? 'success' : usable ? 'sage' : 'neutral'} dot>
            {readyStateLabel(option.readyState)}
        </StatusPill>
    );

    if (!usable) {
        return (
            <a
                href={option.installUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(rowClass, 'hover:border-primary hover:bg-primary-soft/40')}
            >
                <WalletIcon name={option.name} icon={option.icon} className="h-10 w-10 opacity-70" />
                <span className="flex-1">
                    <span className="block font-medium">{option.name}</span>
                    <span className="block text-xs text-muted-foreground">Install {option.name} to continue</span>
                </span>
                {pill}
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </a>
        );
    }

    return (
        <button
            type="button"
            onClick={onConnect}
            disabled={disabled}
            className={cn(
                rowClass,
                'hover:-translate-y-px hover:border-primary hover:shadow-card disabled:pointer-events-none disabled:opacity-60',
                isConnecting && 'border-primary bg-primary-soft/50 opacity-100',
            )}
        >
            <WalletIcon name={option.name} icon={option.icon} className="h-10 w-10" />
            <span className="flex-1">
                <span className="block font-medium">Connect {option.name}</span>
                <span className="block text-xs text-muted-foreground">
                    {isConnecting ? 'Approve the request in your wallet…' : 'Approve the connection in your wallet'}
                </span>
            </span>
            {isConnecting ? <Loader2 className="h-5 w-5 animate-spin text-primary-strong" aria-label="Connecting" /> : pill}
        </button>
    );
};

const WalletOptionList = () => {
    const { options, connectTo, connecting, connectingName } = useWalletConnect();
    const { walletError, clearWalletError } = useSession();

    return (
        <div className="flex flex-col gap-3">
            {options.map((option) => (
                <WalletRow
                    key={option.name}
                    option={option}
                    isConnecting={connectingName === option.name}
                    disabled={connecting}
                    onConnect={() => connectTo(option.name)}
                />
            ))}

            {walletError && (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
                >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <p className="flex-1">{walletError}</p>
                    <button type="button" onClick={clearWalletError} aria-label="Dismiss error" className="shrink-0">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default WalletOptionList;
