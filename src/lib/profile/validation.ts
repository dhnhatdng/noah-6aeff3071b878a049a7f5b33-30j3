import { isValidLink } from './links';
import type { ProfileData } from './types';

export type EditorTab = 'basics' | 'professional' | 'matchmaking' | 'links';

export const EDITOR_TABS: { value: EditorTab; label: string }[] = [
    { value: 'basics', label: 'Basics' },
    { value: 'professional', label: 'Professional' },
    { value: 'matchmaking', label: 'Matchmaking' },
    { value: 'links', label: 'Links' },
];

export const isEditorTab = (value: string | null): value is EditorTab =>
    EDITOR_TABS.some((t) => t.value === value);

export type ProfileFieldKey = 'fullName' | 'role' | 'projects' | 'website' | 'x' | 'linkedin' | 'github';

export type ProfileErrors = Partial<Record<ProfileFieldKey, string>>;

export const FIELD_TAB: Record<ProfileFieldKey, EditorTab> = {
    fullName: 'basics',
    role: 'basics',
    projects: 'professional',
    website: 'links',
    x: 'links',
    linkedin: 'links',
    github: 'links',
};

export const validateProfile = (d: ProfileData): ProfileErrors => {
    const errors: ProfileErrors = {};
    if (!d.fullName.trim()) errors.fullName = 'Add your full name.';
    if (!d.role.trim()) errors.role = 'Add your role so people know what you do.';
    if (d.projects.some((p) => !p.name.trim() && p.summary.trim())) {
        errors.projects = 'Every project needs a name.';
    }
    if (!isValidLink('website', d.links.website)) errors.website = 'Enter a valid website URL.';
    if (!isValidLink('x', d.links.x)) errors.x = 'Enter an @handle or an x.com link.';
    if (!isValidLink('linkedin', d.links.linkedin)) errors.linkedin = 'Enter a linkedin.com profile URL.';
    if (!isValidLink('github', d.links.github)) errors.github = 'Enter a GitHub username or github.com link.';
    return errors;
};
