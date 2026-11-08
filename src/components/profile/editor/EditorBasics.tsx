import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import FormField from '@/components/common/FormField';
import PhotoUpload from '@/components/profile/PhotoUpload';
import { LIMITS } from '@/lib/profile/normalize';
import { counter, inputClass, textareaClass, type EditorSectionProps } from './shared';

const EditorBasics = ({ draft, errors, update }: EditorSectionProps) => (
    <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
            <PhotoUpload value={draft.photoUrl} name={draft.fullName} onChange={(photoUrl) => update({ photoUrl })} />
        </div>
        <FormField label="Full name" htmlFor="fullName" required error={errors.fullName}>
            <Input
                id="fullName"
                value={draft.fullName}
                maxLength={LIMITS.shortText}
                autoComplete="name"
                placeholder="e.g. Alex Rivera"
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                onChange={(e) => update({ fullName: e.target.value })}
                className={inputClass}
            />
        </FormField>
        <FormField label="Role" htmlFor="role" required error={errors.role}>
            <Input
                id="role"
                value={draft.role}
                maxLength={LIMITS.shortText}
                autoComplete="organization-title"
                placeholder="e.g. Protocol engineer"
                aria-invalid={Boolean(errors.role)}
                aria-describedby={errors.role ? 'role-error' : undefined}
                onChange={(e) => update({ role: e.target.value })}
                className={inputClass}
            />
        </FormField>
        <FormField label="Organization" htmlFor="organization">
            <Input
                id="organization"
                value={draft.organization}
                maxLength={LIMITS.shortText}
                autoComplete="organization"
                placeholder="Company, project or Independent"
                onChange={(e) => update({ organization: e.target.value })}
                className={inputClass}
            />
        </FormField>
        <FormField label="Location" htmlFor="location">
            <Input
                id="location"
                value={draft.location}
                maxLength={LIMITS.location}
                placeholder="City, Country"
                onChange={(e) => update({ location: e.target.value })}
                className={inputClass}
            />
        </FormField>
        <FormField
            label="Professional description"
            htmlFor="description"
            className="sm:col-span-2"
            hint={`What you do and what you care about. ${counter(draft.description, LIMITS.description)}`}
        >
            <Textarea
                id="description"
                rows={5}
                value={draft.description}
                maxLength={LIMITS.description}
                onChange={(e) => update({ description: e.target.value })}
                className={textareaClass}
            />
        </FormField>
    </div>
);

export default EditorBasics;
