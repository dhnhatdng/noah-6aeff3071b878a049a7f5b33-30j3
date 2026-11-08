import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const pillVariants = cva(
    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium leading-none',
    {
        variants: {
            variant: {
                neutral: 'bg-secondary text-muted-foreground',
                sage: 'bg-primary-soft text-primary-strong',
                success: 'bg-success-soft text-success',
                warning: 'bg-warning-soft text-warning',
                danger: 'bg-destructive-soft text-destructive',
            },
        },
        defaultVariants: { variant: 'neutral' },
    },
);

interface StatusPillProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof pillVariants> {
    dot?: boolean;
}

const StatusPill = ({ variant, dot, className, children, ...rest }: StatusPillProps) => (
    <span className={cn(pillVariants({ variant }), className)} {...rest}>
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
        {children}
    </span>
);

export default StatusPill;
