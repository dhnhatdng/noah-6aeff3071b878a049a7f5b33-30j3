import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FormField from '@/components/common/FormField';
import TagInput from '@/components/profile/TagInput';
import ProjectsEditor from '@/components/profile/ProjectsEditor';
import { EXPERIENCE_LEVELS, type ExperienceLevel } from '@/lib/profile/options';
import { LIMITS } from '@/lib/profile/normalize';
import { counter, textareaClass, type EditorSectionProps } from './shared';

const EditorProfessional = ({ draft, errors, update }: EditorSectionProps) => (
    <div className="grid gap-6">
        <FormField label="Expertise" htmlFor="expertise" hint="Broad areas you know deeply, e.g. DeFi, payments, security.">
            <TagInput id="expertise" value={draft.expertise} onChange={(expertise) => update({ expertise })} placeholder="Add an area of expertise" />
        </FormField>
        <FormField label="Skills" htmlFor="skills" hint="Concrete tools and abilities, e.g. Rust, Anchor, fundraising.">
            <TagInput id="skills" value={draft.skills} onChange={(skills) => update({ skills })} placeholder="Add a skill" />
        </FormField>

        <ProjectsEditor value={draft.projects} onChange={(projects) => update({ projects })} error={errors.projects} />

        <div className="grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)]">
            <FormField label="Years of experience" htmlFor="experienceLevel">
                <Select
                    value={draft.experienceLevel || undefined}
                    onValueChange={(v) => update({ experienceLevel: v as ExperienceLevel })}
                >
                    <SelectTrigger id="experienceLevel" className="h-11 rounded-xl border-border bg-background">
                        <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border">
                        {EXPERIENCE_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                                {level.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FormField>
            <FormField
                label="Experience"
                htmlFor="experience"
                hint={`Relevant background in a few lines. ${counter(draft.experience, LIMITS.experience)}`}
            >
                <Textarea
                    id="experience"
                    rows={3}
                    value={draft.experience}
                    maxLength={LIMITS.experience}
                    onChange={(e) => update({ experience: e.target.value })}
                    className={textareaClass}
                />
            </FormField>
        </div>

        <FormField label="Interests" htmlFor="interests" hint="Topics you enjoy, inside or outside crypto.">
            <TagInput id="interests" value={draft.interests} onChange={(interests) => update({ interests })} placeholder="Add an interest" />
        </FormField>
    </div>
);

export default EditorProfessional;
