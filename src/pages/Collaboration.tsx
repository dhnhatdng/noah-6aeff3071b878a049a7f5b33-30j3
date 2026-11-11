import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Mail, NotebookPen, Plus, Trash2, UserRoundPlus, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import FormField from '@/components/common/FormField';
import AppModal from '@/components/common/AppModal';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import DemoUserBadge from '@/components/profile/DemoUserBadge';
import { useProfile } from '@/hooks/useProfile';
import { useConnections } from '@/hooks/useConnections';
import { useCollaborations } from '@/hooks/useCollaborations';
import { toast } from '@/hooks/use-toast';
import { findDemoProfile } from '@/lib/collaborations/store';

const when = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const Collaboration = () => {
    const { profile, status } = useProfile();
    const { records } = useConnections();
    const { collaborations, notesFor, createCollaboration, deleteCollaboration, addNote } = useCollaborations();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [invited, setInvited] = useState<string[]>([]);
    const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

    const accepted = useMemo(
        () =>
            records
                .filter((r) => r.status === 'accepted')
                .flatMap((r) => {
                    const person = findDemoProfile(r.counterpartId);
                    return person ? [person] : [];
                }),
        [records],
    );

    const resetForm = () => {
        setName('');
        setDescription('');
        setInvited([]);
    };

    const handleCreate = () => {
        try {
            const record = createCollaboration({ name, description, memberIds: invited });
            toast({
                title: `Collaboration “${record.name}” created`,
                description: invited.length
                    ? `Saved in this browser with ${invited.length} demo member${invited.length === 1 ? '' : 's'}. No invitation was sent — demo members are fictional.`
                    : 'Saved in this browser only. Invite accepted connections to add members.',
            });
            resetForm();
            setOpen(false);
        } catch (err) {
            toast({
                title: 'Could not create collaboration',
                description: err instanceof Error ? err.message : 'Something went wrong.',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = (id: string, collabName: string) => {
        try {
            deleteCollaboration(id);
            toast({ title: `“${collabName}” deleted`, description: 'Its shared notes were deleted with it.' });
        } catch (err) {
            toast({
                title: 'Could not delete collaboration',
                description: err instanceof Error ? err.message : 'Something went wrong.',
                variant: 'destructive',
            });
        }
    };

    const handleAddNote = (collaborationId: string) => {
        const body = noteDrafts[collaborationId] ?? '';
        try {
            addNote(collaborationId, body);
            setNoteDrafts((d) => ({ ...d, [collaborationId]: '' }));
        } catch (err) {
            toast({
                title: 'Could not add note',
                description: err instanceof Error ? err.message : 'Something went wrong.',
                variant: 'destructive',
            });
        }
    };

    const header = (
        <PageHeader
            eyebrow="Collaboration Hub"
            title="Build together"
            description="Turn conversations into projects — shared spaces, notes and invitations. Everything here is stored in this browser only."
            actions={
                <Button className="rounded-xl" onClick={() => setOpen(true)} disabled={!profile}>
                    <Plus className="h-4 w-4" /> New collaboration
                </Button>
            }
        />
    );

    if (status === 'loading') {
        return (
            <div className="flex flex-col gap-8">
                {header}
                <SurfaceCard>
                    <EmptyState icon={Layers} title="Loading…" description="Reading your saved collaborations." />
                </SurfaceCard>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col gap-8">
                {header}
                <SurfaceCard>
                    <EmptyState
                        icon={UserRoundPlus}
                        title="Create your profile to start collaborating"
                        description="Collaborations are linked to your profile and invite your accepted connections."
                        action={
                            <Button asChild className="rounded-xl">
                                <Link to="/profile?edit=basics">Create profile</Link>
                            </Button>
                        }
                    />
                </SurfaceCard>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {header}

            <SurfaceCard title="Active collaborations" description={`${collaborations.length} saved in this browser`}>
                {collaborations.length === 0 ? (
                    <EmptyState
                        icon={Layers}
                        title="No collaborations yet"
                        description="Create one to keep building with your connections after the event."
                        action={
                            <Button size="sm" className="rounded-lg" onClick={() => setOpen(true)}>
                                <Plus className="h-4 w-4" /> New collaboration
                            </Button>
                        }
                    />
                ) : (
                    <ul className="flex flex-col gap-4">
                        {collaborations.map((collab) => {
                            const members = collab.memberIds.flatMap((id) => {
                                const person = findDemoProfile(id);
                                return person ? [person] : [];
                            });
                            const notes = notesFor(collab.id);
                            return (
                                <li key={collab.id} className="rounded-xl border border-border bg-background p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium">{collab.name}</p>
                                            {collab.description && (
                                                <p className="mt-1 text-sm text-muted-foreground">{collab.description}</p>
                                            )}
                                            <p className="mt-1 text-xs text-muted-foreground">Created {when(collab.createdAt)}</p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-lg border-border text-destructive"
                                            onClick={() => handleDelete(collab.id, collab.name)}
                                        >
                                            <Trash2 className="h-4 w-4" /> Delete
                                        </Button>
                                    </div>

                                    <div className="mt-3">
                                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                            <UsersRound className="h-3.5 w-3.5" aria-hidden /> Members ({members.length + 1})
                                        </p>
                                        {members.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">
                                                Just you so far — invite accepted connections when you create the next one.
                                            </p>
                                        ) : (
                                            <ul className="flex flex-col gap-2">
                                                {members.map((m) => (
                                                    <li key={m.id} className="flex items-center gap-2 text-sm">
                                                        <ProfileAvatar name={m.fullName} photoUrl={m.photoUrl} size="sm" />
                                                        <span>
                                                            {m.fullName} · {m.role}
                                                        </span>
                                                        <DemoUserBadge />
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="mt-4 border-t border-border pt-4">
                                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                            <NotebookPen className="h-3.5 w-3.5" aria-hidden /> Shared notes ({notes.length})
                                        </p>
                                        {notes.length > 0 && (
                                            <ul className="mb-3 flex flex-col gap-2">
                                                {notes.map((n) => (
                                                    <li key={n.id} className="rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                                                        <p>{n.body}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{when(n.createdAt)}</p>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <Textarea
                                                value={noteDrafts[collab.id] ?? ''}
                                                onChange={(e) => setNoteDrafts((d) => ({ ...d, [collab.id]: e.target.value }))}
                                                placeholder="Add a shared note for this collaboration…"
                                                className="min-h-[40px] flex-1"
                                            />
                                            <Button
                                                variant="outline"
                                                className="rounded-lg border-border"
                                                onClick={() => handleAddNote(collab.id)}
                                            >
                                                Add note
                                            </Button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </SurfaceCard>

            <div className="grid gap-6 md:grid-cols-2">
                <SurfaceCard title="Shared notes" description="Notes live inside each collaboration above.">
                    <EmptyState
                        compact
                        icon={NotebookPen}
                        title={collaborations.length ? 'Notes are on the collaboration cards' : 'No notes yet'}
                        description="Add a note to a collaboration to share context with its members."
                    />
                </SurfaceCard>
                <SurfaceCard title="Invitations">
                    <EmptyState
                        compact
                        icon={Mail}
                        title="No invitations"
                        description="No invitations have been sent — demo members are fictional, so collaborations are created locally and never sent to real people."
                    />
                </SurfaceCard>
            </div>

            <AppModal
                open={open}
                onOpenChange={(v) => {
                    setOpen(v);
                    if (!v) resetForm();
                }}
                title="New collaboration"
                description="Saved in this browser only. Invite people from your accepted connections."
                footer={
                    <>
                        <Button variant="outline" className="rounded-xl border-border" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="rounded-xl" onClick={handleCreate}>
                            Create collaboration
                        </Button>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <FormField label="Name" htmlFor="collab-name" required>
                        <Input
                            id="collab-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Solana payments pilot"
                        />
                    </FormField>
                    <FormField label="Description" htmlFor="collab-description" hint="Optional — what are you building together?">
                        <Textarea
                            id="collab-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A short description for members…"
                        />
                    </FormField>
                    <div>
                        <p className="mb-2 text-sm font-medium">Invite accepted connections</p>
                        {accepted.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No accepted connections yet — accept a request on the Connections page first. You can still
                                create the collaboration and add members later.
                            </p>
                        ) : (
                            <ul className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                                {accepted.map((person) => (
                                    <li key={person.id}>
                                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary/60">
                                            <input
                                                type="checkbox"
                                                checked={invited.includes(person.id)}
                                                onChange={(e) =>
                                                    setInvited((prev) =>
                                                        e.target.checked
                                                            ? [...prev, person.id]
                                                            : prev.filter((id) => id !== person.id),
                                                    )
                                                }
                                                className="h-4 w-4 accent-primary"
                                            />
                                            <ProfileAvatar name={person.fullName} photoUrl={person.photoUrl} size="sm" />
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">{person.fullName}</span>
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {person.role} · {person.organization}
                                                </span>
                                            </span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </AppModal>
        </div>
    );
};

export default Collaboration;
