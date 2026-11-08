import { cn } from '@/lib/utils';

interface BrandLogoProps {
    compact?: boolean;
    className?: string;
}

/** Two overlapping rings — two people meeting. */
const BrandMark = () => (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-card">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <circle cx="9" cy="12" r="5" />
            <circle cx="15" cy="12" r="5" />
        </svg>
    </span>
);

const BrandLogo = ({ compact, className }: BrandLogoProps) => (
    <div className={cn('flex items-center gap-2.5', className)} aria-label="Breakpoint Connect">
        <BrandMark />
        {!compact && (
            <span className="leading-none">
                <span className="block font-display text-[17px] font-semibold tracking-tight">Breakpoint</span>
                <span className="mt-1 block text-[10.5px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    Connect
                </span>
            </span>
        )}
    </div>
);

export default BrandLogo;
