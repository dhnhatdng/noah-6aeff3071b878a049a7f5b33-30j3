import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectChipsProps {
    id: string;
    label: string;
    options: readonly string[];
    value: string[];
    onChange: (value: string[]) => void;
    max?: number;
}

const MultiSelectChips = ({ id, label, options, value, onChange, max }: MultiSelectChipsProps) => {
    // Preserve any saved values that are no longer in the option list.
    const all = [...options, ...value.filter((v) => !options.includes(v))];
    const atMax = max !== undefined && value.length >= max;

    const toggle = (option: string) => {
        if (value.includes(option)) onChange(value.filter((v) => v !== option));
        else if (!atMax) onChange([...value, option]);
    };

    return (
        <div className="flex flex-col gap-2">
            <div id={id} role="group" aria-label={label} className="flex flex-wrap gap-2">
                {all.map((option) => {
                    const selected = value.includes(option);
                    return (
                        <button
                            key={option}
                            type="button"
                            aria-pressed={selected}
                            disabled={!selected && atMax}
                            onClick={() => toggle(option)}
                            className={cn(
                                'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-200 ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40',
                                selected
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground',
                            )}
                        >
                            {selected && <Check className="h-3.5 w-3.5" aria-hidden />}
                            {option}
                        </button>
                    );
                })}
            </div>
            {max !== undefined && (
                <p className="text-xs text-muted-foreground">
                    {value.length} of up to {max} selected
                </p>
            )}
        </div>
    );
};

export default MultiSelectChips;
