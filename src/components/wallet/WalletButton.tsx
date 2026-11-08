import { ChevronDown, Copy, ExternalLink, Loader2, LogOut, Settings, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { useSession } from '@/hooks/useSession';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { explorerAddressUrl } from '@/lib/config';
import { shortenAddress } from '@/lib/wallet';
import { cn } from '@/lib/utils';
import WalletIcon from './WalletIcon';

const WalletButton = ({ className }: { className?: string }) => {
    const { connected, connecting, disconnecting, address, walletName, walletIcon, disconnectWallet } =
        useWalletConnect();
    const { setConnectDialogOpen } = useSession();
    const { copy } = useCopyToClipboard();
    const navigate = useNavigate();

    if (connecting || disconnecting) {
        return (
            <Button disabled className={cn('h-9 rounded-xl', className)}>
                <Loader2 className="h-4 w-4 animate-spin" />
                {connecting ? 'Connecting…' : 'Disconnecting…'}
            </Button>
        );
    }

    if (!connected || !address) {
        return (
            <Button onClick={() => setConnectDialogOpen(true)} className={cn('h-9 rounded-xl font-semibold', className)}>
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Connect wallet</span>
                <span className="sm:hidden">Connect</span>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn('h-9 gap-2 rounded-xl border-border bg-card pl-2 pr-3', className)}>
                    <WalletIcon name={walletName ?? 'W'} icon={walletIcon} className="h-6 w-6 rounded-md" />
                    <span className="font-mono text-xs">{shortenAddress(address)}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border-border">
                <DropdownMenuLabel className="flex flex-col gap-1 font-normal">
                    <span className="text-xs text-muted-foreground">Connected with {walletName}</span>
                    <span className="break-all font-mono text-xs">{address}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => copy(address, 'Wallet address copied')}>
                    <Copy className="mr-2 h-4 w-4" /> Copy full address
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <a href={explorerAddressUrl(address)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> View on Explorer
                    </a>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" /> Wallet settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnectWallet} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Disconnect
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default WalletButton;
