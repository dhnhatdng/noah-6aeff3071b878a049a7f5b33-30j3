import { Input } from '@/components/ui/input';
import FormField from '@/components/common/FormField';
import type { SocialLinks } from '@/lib/profile/types';
import { inputClass, type EditorSectionProps } from './shared';

const FIELDS: { key: keyof SocialLinks; label: string; placeholder: string; hint: string }[] = [
    { key: 'website', label: 'Website', placeholder: 'https://yourproject.xyz', hint: 'Personal or project website.' },
    { key: 'x', label: 'X profile', placeholder: '@handle', hint: 'Handle or x.com link.' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/you', hint: 'Full profile URL.' },
    { key: 'github', label: 'GitHub', placeholder: 'username', hint: 'Username or github.com link.' },
];

const EditorLinks = ({ draft, errors, update }: EditorSectionProps) => (
    <div className="grid gap-5 sm:grid-cols-2">
        {FIELDS.map((f) => (
            <FormField key={f.key} label={f.label} htmlFor={`link-${f.key}`} hint={f.hint} error={errors[f.key]}>
                <Input
                    id={`link-${f.key}`}
                    value={draft.links[f.key]}
                    placeholder={f.placeholder}
                    inputMode="url"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-invalid={Boolean(errors[f.key])}
                    aria-describedby={errors[f.key] ? `link-${f.key}-error` : undefined}
                    onChange={(e) => update({ links: { ...draft.links, [f.key]: e.target.value } })}
                    className={inputClass}
                />
            </FormField>
        ))}
    </div>
);

export default EditorLinks;
