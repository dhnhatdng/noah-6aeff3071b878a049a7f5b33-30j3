import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
    compact?: boolean;
}

const EmptyState = ({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) => (
    <div
        className={cn(
            'flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background/60 text-center',
            compact ? 'gap-2 px-4 py-6' : 'gap-3 px-6 py-10',
            className,
        )}
    >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary-strong">
            <Icon className="h-5 w-5" aria-hidden />
        </span>
        <p className="font-medium">{title}</p>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
        {action && <div className="mt-1">{action}</div>}
    </div>
);

export default EmptyState;
