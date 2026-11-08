import { cn } from '@/lib/utils';

interface WalletIconProps {
    name: string;
    icon?: string;
    className?: string;
}

const WalletIcon = ({ name, icon, className }: WalletIconProps) =>
    icon ? (
        <img src={icon} alt="" className={cn('h-8 w-8 rounded-lg', className)} />
    ) : (
        <span
            className={cn(
                'grid h-8 w-8 place-items-center rounded-lg bg-secondary text-sm font-semibold text-muted-foreground',
                className,
            )}
            aria-hidden
        >
            {name.charAt(0)}
        </span>
    );

export default WalletIcon;
