import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AppModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    className?: string;
}

const AppModal = ({ open, onOpenChange, title, description, children, footer, className }: AppModalProps) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
            className={cn('gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-raised sm:max-w-md', className)}
        >
            <DialogHeader className="px-6 pb-2 pt-6 text-left">
                <DialogTitle className="font-display text-xl font-semibold">{title}</DialogTitle>
                {description && (
                    <DialogDescription className="text-sm text-muted-foreground">{description}</DialogDescription>
                )}
            </DialogHeader>
            {children && <div className="px-6 py-4">{children}</div>}
            {footer && (
                <div className="flex flex-col-reverse gap-2 border-t border-border bg-background/60 px-6 py-4 sm:flex-row sm:justify-end">
                    {footer}
                </div>
            )}
        </DialogContent>
    </Dialog>
);

export default AppModal;
