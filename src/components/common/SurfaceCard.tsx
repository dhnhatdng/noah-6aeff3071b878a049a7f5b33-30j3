import type { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const surfaceVariants = cva('rounded-2xl border transition-shadow duration-300 ease-standard', {
    variants: {
        tone: {
            default: 'bg-card border-border shadow-card',
            sage: 'bg-primary-soft border-primary/40',
            sunken: 'bg-secondary/60 border-border',
        },
        padding: {
            default: 'p-5 sm:p-6',
            none: 'p-0',
            lg: 'p-6 sm:p-8',
        },
    },
    defaultVariants: { tone: 'default', padding: 'default' },
});

interface SurfaceCardProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
        VariantProps<typeof surfaceVariants> {
    title?: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
}

const SurfaceCard = ({ title, description, action, tone, padding, className, children, ...rest }: SurfaceCardProps) => (
    <section className={cn(surfaceVariants({ tone, padding }), 'flex flex-col', className)} {...rest}>
        {(title || action) && (
            <header className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                    {title && <h2 className="font-display text-lg font-semibold leading-tight">{title}</h2>}
                    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </header>
        )}
        {children}
    </section>
);

export default SurfaceCard;
