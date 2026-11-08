import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const SecurityNote = ({ className }: { className?: string }) => (
    <p className={cn('flex items-start gap-2 text-xs leading-relaxed text-muted-foreground', className)}>
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-strong" aria-hidden />
        <span>
            Breakpoint Connect will never ask for your seed phrase or private key. Connecting shares only your public
            address.
        </span>
    </p>
);

export default SecurityNote;
