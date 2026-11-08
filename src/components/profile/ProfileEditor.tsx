import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatusPill from '@/components/common/StatusPill';
import { toast } from '@/hooks/use-toast';
import { EDITOR_TABS, FIELD_TAB, validateProfile, type EditorTab, type ProfileErrors, type ProfileFieldKey } from '@/lib/profile/validation';
import type { ProfileData } from '@/lib/profile/types';
import { cn } from '@/lib/utils';
import EditorBasics from './editor/EditorBasics';
import EditorProfessional from './editor/EditorProfessional';
import EditorMatchmaking from './editor/EditorMatchmaking';
import EditorLinks from './editor/EditorLinks';

interface ProfileEditorProps {
    mode: 'create' | 'edit';
    initial: ProfileData;
    initialTab?: EditorTab;
    onSave: (data: ProfileData) => Promise<void>;
    onCancel?: () => void;
}

const tabTrigger =
    'relative rounded-lg px-4 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card';

const ProfileEditor = ({ mode, initial, initialTab = 'basics', onSave, onCancel }: ProfileEditorProps) => {
    const [draft, setDraft] = useState<ProfileData>(initial);
    const [tab, setTab] = useState<EditorTab>(initialTab);
    const [errors, setErrors] = useState<ProfileErrors>({});
    const [submitted, setSubmitted] = useState(false);
    const [saving, setSaving] = useState(false);

    const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(initial), [draft, initial]);
    const update = (patch: Partial<ProfileData>) => setDraft((d) => ({ ...d, ...patch }));

    // Re-validate live only after the first submit attempt.
    useEffect(() => {
        if (submitted) setErrors(validateProfile(draft));
    }, [draft, submitted]);

    const errorsIn = (t: EditorTab) =>
        (Object.keys(errors) as ProfileFieldKey[]).filter((k) => FIELD_TAB[k] === t).length;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        const found = validateProfile(draft);
        setErrors(found);
        const keys = Object.keys(found) as ProfileFieldKey[];
        if (keys.length > 0) {
            setTab(FIELD_TAB[keys[0]]);
            toast({ title: 'Check the highlighted fields', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            await onSave(draft);
        } catch (err) {
            toast({
                title: 'Profile not saved',
                description: err instanceof Error ? err.message : 'Something went wrong.',
                variant: 'destructive',
            });
            setSaving(false);
        }
    };

    const sectionProps = { draft, errors, update };

    return (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col rounded-2xl border border-border bg-card shadow-card">
            <Tabs value={tab} onValueChange={(v) => setTab(v as EditorTab)} className="flex flex-col">
                <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <h2 className="font-display text-lg font-semibold">
                            {mode === 'create' ? 'Create your profile' : 'Edit profile'}
                        </h2>
                        <p className="text-sm text-muted-foreground">Fields marked * are required.</p>
                    </div>
                    {dirty && <StatusPill variant="warning" dot>Unsaved changes</StatusPill>}
                </div>
                <div className="overflow-x-auto px-5 pt-5 sm:px-6">
                    <TabsList className="h-auto rounded-xl bg-secondary p-1">
                        {EDITOR_TABS.map((t) => {
                            const count = errorsIn(t.value);
                            return (
                                <TabsTrigger key={t.value} value={t.value} className={tabTrigger}>
                                    {t.label}
                                    {count > 0 && (
                                        <span className="ml-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                                            {count}
                                        </span>
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>
                <div className="p-5 sm:p-6">
                    <TabsContent value="basics" className="mt-0"><EditorBasics {...sectionProps} /></TabsContent>
                    <TabsContent value="professional" className="mt-0"><EditorProfessional {...sectionProps} /></TabsContent>
                    <TabsContent value="matchmaking" className="mt-0"><EditorMatchmaking {...sectionProps} /></TabsContent>
                    <TabsContent value="links" className="mt-0"><EditorLinks {...sectionProps} /></TabsContent>
                </div>
            </Tabs>

            <div
                className={cn(
                    'sticky bottom-[72px] flex flex-col-reverse gap-2 rounded-b-2xl border-t border-border bg-card/95 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6 md:bottom-0',
                )}
            >
                {onCancel && (
                    <Button type="button" variant="ghost" className="rounded-xl" onClick={onCancel} disabled={saving}>
                        {dirty ? 'Discard changes' : 'Cancel'}
                    </Button>
                )}
                <Button type="submit" className="rounded-xl font-semibold" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {mode === 'create' ? 'Create profile' : 'Save changes'}
                </Button>
            </div>
        </form>
    );
};

export default ProfileEditor;
