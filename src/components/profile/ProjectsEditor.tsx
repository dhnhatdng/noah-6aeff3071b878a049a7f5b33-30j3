import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { generateId } from '@/lib/profile/ids';
import { LIMITS } from '@/lib/profile/normalize';
import type { ProfileProject } from '@/lib/profile/types';

interface ProjectsEditorProps {
    value: ProfileProject[];
    onChange: (value: ProfileProject[]) => void;
    error?: string;
}

const ProjectsEditor = ({ value, onChange, error }: ProjectsEditorProps) => {
    const updateAt = (index: number, patch: Partial<ProfileProject>) =>
        onChange(value.map((p, i) => (i === index ? { ...p, ...patch } : p)));

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Current projects</p>
                <span className="text-xs text-muted-foreground">
                    {value.length}/{LIMITS.maxProjects}
                </span>
            </div>
            {value.length === 0 && (
                <p className="rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                    No projects yet. Add what you are working on right now.
                </p>
            )}
            {value.map((project, index) => (
                <div key={project.id} className="flex flex-col gap-2 rounded-xl border border-border bg-background p-3">
                    <div className="flex items-center gap-2">
                        <Input
                            aria-label={`Project ${index + 1} name`}
                            value={project.name}
                            maxLength={LIMITS.projectName}
                            onChange={(e) => updateAt(index, { name: e.target.value })}
                            placeholder="Project name"
                            aria-invalid={Boolean(error && !project.name.trim() && project.summary.trim())}
                            className="rounded-lg border-border bg-card aria-[invalid=true]:border-destructive"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 rounded-lg text-muted-foreground hover:bg-destructive-soft hover:text-destructive"
                            onClick={() => onChange(value.filter((_, i) => i !== index))}
                            aria-label={`Remove project ${index + 1}`}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <Textarea
                        aria-label={`Project ${index + 1} summary`}
                        value={project.summary}
                        maxLength={LIMITS.projectSummary}
                        onChange={(e) => updateAt(index, { summary: e.target.value })}
                        placeholder="One-line summary"
                        rows={2}
                        className="rounded-lg border-border bg-card"
                    />
                </div>
            ))}
            {error && (
                <p role="alert" className="text-xs font-medium text-destructive">
                    {error}
                </p>
            )}
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start rounded-lg border-border"
                disabled={value.length >= LIMITS.maxProjects}
                onClick={() => onChange([...value, { id: generateId(), name: '', summary: '' }])}
            >
                <Plus className="h-4 w-4" /> Add project
            </Button>
        </div>
    );
};

export default ProjectsEditor;
