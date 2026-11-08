import { Loader2, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { useSession } from '@/hooks/useSession';
import { shortenAddress } from '@/lib/wallet';
import WalletIcon from '@/components/wallet/WalletIcon';
import { cn } from '@/lib/utils';

/** Wallet access inside the main navigation. Icon-only on tablet rail, full panel on desktop. */
const SidebarWalletPanel = ({ expanded = false }: { expanded?: boolean }) => {
    const { connected, connecting, address, walletName, walletIcon } = useWalletConnect();
    const { setConnectDialogOpen, isGuest } = useSession();

    const fullClass = expanded ? 'flex' : 'hidden lg:flex';
    const railClass = expanded ? 'hidden' : 'flex lg:hidden';

    if (connected && address) {
        return (
            <>
                <Link
                    to="/settings"
                    className={cn(
                        fullClass,
                        'items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition-colors hover:border-primary',
                    )}
                >
                    <WalletIcon name={walletName ?? 'W'} icon={walletIcon} className="h-8 w-8" />
                    <span className="min-w-0 flex-1">
                        <span className="block text-xs text-muted-foreground">{walletName}</span>
                        <span className="block truncate font-mono text-xs">{shortenAddress(address)}</span>
                    </span>
                    <span className="h-2 w-2 rounded-full bg-success" aria-label="Connected" />
                </Link>
                <Link
                    to="/settings"
                    title={`${walletName} · ${shortenAddress(address)}`}
                    className={cn(railClass, 'mx-auto h-11 w-11 items-center justify-center rounded-xl border border-border bg-background')}
                >
                    <WalletIcon name={walletName ?? 'W'} icon={walletIcon} className="h-6 w-6" />
                </Link>
            </>
        );
    }

    return (
        <>
            <div className={cn(fullClass, 'flex-col gap-2 rounded-xl border border-dashed border-border bg-background p-3')}>
                <p className="text-xs text-muted-foreground">
                    {isGuest ? 'Guest demo mode — no wallet connected.' : 'No wallet connected.'}
                </p>
                <button
                    type="button"
                    onClick={() => setConnectDialogOpen(true)}
                    disabled={connecting}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-60"
                >
                    {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                    {connecting ? 'Connecting…' : 'Connect wallet'}
                </button>
            </div>
            <button
                type="button"
                onClick={() => setConnectDialogOpen(true)}
                title="Connect wallet"
                aria-label="Connect wallet"
                className={cn(railClass, 'mx-auto h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground')}
            >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            </button>
        </>
    );
};

export default SidebarWalletPanel;
