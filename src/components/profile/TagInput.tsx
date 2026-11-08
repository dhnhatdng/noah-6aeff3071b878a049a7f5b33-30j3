import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { LIMITS } from '@/lib/profile/normalize';

interface TagInputProps {
    id: string;
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    max?: number;
}

/** Free-form tags. Enter or comma adds, Backspace on empty removes the last tag. */
const TagInput = ({ id, value, onChange, placeholder, max = LIMITS.maxTags }: TagInputProps) => {
    const [text, setText] = useState('');
    const full = value.length >= max;

    const commit = (raw: string) => {
        const parts = raw
            .split(',')
            .map((s) => s.trim().slice(0, LIMITS.tagLength))
            .filter(Boolean);
        if (parts.length === 0) {
            setText('');
            return;
        }
        const next = [...value];
        for (const part of parts) {
            if (next.length >= max) break;
            if (!next.some((v) => v.toLowerCase() === part.toLowerCase())) next.push(part);
        }
        onChange(next);
        setText('');
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit(text);
        } else if (e.key === 'Backspace' && !text && value.length > 0) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-border bg-background px-2 py-1.5 transition-shadow focus-within:ring-2 focus-within:ring-ring">
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pl-2.5 pr-1 text-xs font-medium text-primary-strong"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => onChange(value.filter((v) => v !== tag))}
                            className="grid h-4 w-4 place-items-center rounded-full hover:bg-primary/40"
                            aria-label={`Remove ${tag}`}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}
                <input
                    id={id}
                    value={text}
                    disabled={full}
                    onChange={(e) => (e.target.value.includes(',') ? commit(e.target.value) : setText(e.target.value))}
                    onKeyDown={onKeyDown}
                    onBlur={() => text && commit(text)}
                    placeholder={full ? 'Limit reached' : value.length ? 'Add another…' : placeholder}
                    className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                />
            </div>
            <p className="flex justify-between text-xs text-muted-foreground">
                <span>Press Enter or comma to add.</span>
                <span>
                    {value.length}/{max}
                </span>
            </p>
        </div>
    );
};

export default TagInput;
