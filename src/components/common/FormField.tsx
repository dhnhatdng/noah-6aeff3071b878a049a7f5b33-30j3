import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
    label: string;
    htmlFor: string;
    hint?: ReactNode;
    error?: string;
    required?: boolean;
    children: ReactNode;
    className?: string;
}

const FormField = ({ label, htmlFor, hint, error, required, children, className }: FormFieldProps) => (
    <div className={cn('flex flex-col gap-2', className)}>
        <Label htmlFor={htmlFor} className="text-sm font-medium">
            {label}
            {required && (
                <span className="ml-0.5 text-destructive" aria-hidden>
                    *
                </span>
            )}
        </Label>
        {children}
        {error ? (
            <p id={`${htmlFor}-error`} role="alert" className="text-xs font-medium text-destructive">
                {error}
            </p>
        ) : (
            hint && <p className="text-xs text-muted-foreground">{hint}</p>
        )}
    </div>
);

export default FormField;
