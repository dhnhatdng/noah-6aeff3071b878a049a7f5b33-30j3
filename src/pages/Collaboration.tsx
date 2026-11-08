import { useState } from 'react';
import { Layers, Mail, NotebookPen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import AppModal from '@/components/common/AppModal';

const Collaboration = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                eyebrow="Collaboration Hub"
                title="Build together"
                description="Turn conversations into projects — shared spaces, notes and invitations."
                actions={
                    <Button className="rounded-xl" onClick={() => setOpen(true)}>
                        <Plus className="h-4 w-4" /> New collaboration
                    </Button>
                }
            />

            <SurfaceCard title="Active collaborations">
                <EmptyState
                    icon={Layers}
                    title="No collaborations yet"
                    description="Collaborations you create or join will be listed here."
                />
            </SurfaceCard>

            <div className="grid gap-6 md:grid-cols-2">
                <SurfaceCard title="Shared notes">
                    <EmptyState compact icon={NotebookPen} title="No notes yet" description="Notes shared within collaborations appear here." />
                </SurfaceCard>
                <SurfaceCard title="Invitations">
                    <EmptyState compact icon={Mail} title="No invitations" description="Invitations to join collaborations appear here." />
                </SurfaceCard>
            </div>

            <AppModal
                open={open}
                onOpenChange={setOpen}
                title="New collaboration"
                description="Creating collaborations will be available in a later phase."
                footer={
                    <Button className="rounded-xl" onClick={() => setOpen(false)}>
                        Got it
                    </Button>
                }
            >
                <p className="text-sm leading-relaxed text-muted-foreground">
                    You’ll be able to name a project, invite connections and share notes. This needs saved profiles and
                    connections first.
                </p>
            </AppModal>
        </div>
    );
};

export default Collaboration;
