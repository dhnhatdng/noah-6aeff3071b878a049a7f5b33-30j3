import { cn } from '@/lib/utils';

interface ChipListProps {
    items: string[];
    tone?: 'sage' | 'neutral';
    empty?: string;
    limit?: number;
    className?: string;
}

const ChipList = ({ items, tone = 'neutral', empty = 'Not added', limit, className }: ChipListProps) => {
    if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
    const visible = limit ? items.slice(0, limit) : items;
    const rest = items.length - visible.length;
    return (
        <ul className={cn('flex flex-wrap gap-1.5', className)}>
            {visible.map((item) => (
                <li
                    key={item}
                    className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium',
                        tone === 'sage' ? 'bg-primary-soft text-primary-strong' : 'border border-border bg-background text-foreground',
                    )}
                >
                    {item}
                </li>
            ))}
            {rest > 0 && <li className="px-1 py-1 text-xs text-muted-foreground">+{rest}</li>}
        </ul>
    );
};

export default ChipList;
