import { Check, Copy, ExternalLink } from 'lucide-react';
import { explorerAddressUrl } from '@/lib/config';
import { shortenAddress } from '@/lib/wallet';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { cn } from '@/lib/utils';

interface AddressDisplayProps {
    address: string;
    className?: string;
}

const iconButton =
    'grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const AddressDisplay = ({ address, className }: AddressDisplayProps) => {
    const { copied, copy } = useCopyToClipboard();

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-1.5',
                className,
            )}
        >
            <span className="truncate font-mono text-sm" title={address}>
                {shortenAddress(address, 6)}
            </span>
            <span className="flex shrink-0 items-center">
                <button
                    type="button"
                    className={iconButton}
                    onClick={() => copy(address, 'Wallet address copied')}
                    aria-label="Copy full wallet address"
                >
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
                <a
                    href={explorerAddressUrl(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={iconButton}
                    aria-label="View on Solana Explorer"
                >
                    <ExternalLink className="h-4 w-4" />
                </a>
            </span>
        </div>
    );
};

export default AddressDisplay;
