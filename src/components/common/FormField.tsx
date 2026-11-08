import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
    label: string;
    htmlFor: string;
    hint?: string;
    children: ReactNode;
    className?: string;
}

const FormField = ({ label, htmlFor, hint, children, className }: FormFieldProps) => (
    <div className={cn('flex flex-col gap-2', className)}>
        <Label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
        </Label>
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
);

export default FormField;
