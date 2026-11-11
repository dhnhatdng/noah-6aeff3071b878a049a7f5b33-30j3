import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, Handshake, Inbox, Info, Send, UserRoundPlus, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import StatusPill from '@/components/common/StatusPill';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import DemoUserBadge from '@/components/profile/DemoUserBadge';
import ProfileDetailDialog from '@/components/profile/ProfileDetailDialog';
import { useConnections } from '@/hooks/useConnections';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';
import { findDemoProfile, type ConnectionRecord } from '@/lib/connections/store';
import type { DemoProfile } from '@/lib/profile/types';

const tabTrigger =
    'rounded-lg px-3 py-1.5 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card sm:px-4';

const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });

interface Row {
    record: ConnectionRecord;
    person: DemoProfile;
}

const PersonRow = ({ row, meta, onOpen, actions }: { row: Row; meta: ReactNode; onOpen: () => void; actions?: ReactNode }) => (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ProfileAvatar name={row.person.fullName} photoUrl={row.person.photoUrl} size="sm" />
            <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium hover:underline">{row.person.fullName}</span>
                    <DemoUserBadge />
                </span>
                <span className="block truncate text-sm text-muted-foreground">
                    {row.person.role} · {row.person.organization}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{meta}</span>
            </span>
        </button>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </li>
);

const Connections = () => {
    const { profile, status } = useProfile();
    const { records, acceptRequest, declineRequest } = useConnections();
    const [selected, setSelected] = useState<DemoProfile | null>(null);

    const { received, sent, connected } = useMemo(() => {
        const rows = records.flatMap((record) => {
            const person = findDemoProfile(record.counterpartId);
            return person ? [{ record, person }] : [];
        });
        const newest = (a: Row, b: Row) => b.record.updatedAt.localeCompare(a.record.updatedAt);
        return {
            received: rows.filter((r) => r.record.status === 'pending' && r.record.direction === 'received').sort(newest),
            sent: rows.filter((r) => r.record.status === 'pending' && r.record.direction === 'sent').sort(newest),
            connected: rows.filter((r) => r.record.status === 'accepted').sort(newest),
        };
    }, [records]);

    const respond = (row: Row, accept: boolean) => {
        try {
            if (accept) acceptRequest(row.record.id);
            else declineRequest(row.record.id);
            toast({
                title: accept ? `You're now connected with ${row.person.fullName}` : 'Request declined',
                description: accept ? 'Find them under My Connections.' : `${row.person.fullName}'s request was removed.`,
            });
        } catch (err) {
            toast({ title: 'Action failed', description: err instanceof Error ? err.message : 'Something went wrong.', variant: 'destructive' });
        }
    };

    const header = (
        <PageHeader
            eyebrow="Connections"
            title="Your network"
            description="Everyone you’ve connected with, plus requests waiting on you or them."
            actions={<StatusPill variant="warning" className="h-9 px-3">DEMO CONNECTIONS</StatusPill>}
        />
    );

    if (status === 'loading') {
        return (
            <div className="flex flex-col gap-8">
                {header}
                <Skeleton className="h-64 rounded-2xl" />
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
                        title="Create your profile to start connecting"
                        description="Connection requests are linked to your profile."
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

            <div role="note" className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                    <strong className="font-semibold">DEMO CONNECTIONS.</strong> Requests are stored in this browser only and
                    are not sent to anyone. Every counterpart is a fictional DEMO USER, so sent requests stay pending. Received
                    requests are simulated locally so you can test accepting and declining.
                </p>
            </div>

            <SurfaceCard>
                <Tabs defaultValue={received.length ? 'received' : 'connected'} className="flex flex-col gap-5">
                    <TabsList className="h-auto self-start overflow-x-auto rounded-xl bg-secondary p-1">
                        <TabsTrigger value="received" className={tabTrigger}>Received ({received.length})</TabsTrigger>
                        <TabsTrigger value="sent" className={tabTrigger}>Sent ({sent.length})</TabsTrigger>
                        <TabsTrigger value="connected" className={tabTrigger}>My Connections ({connected.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="received" className="mt-0">
                        {received.length === 0 ? (
                            <EmptyState
                                icon={Inbox}
                                title="No requests received"
                                description="Simulated demo requests appear once your matchmaking profile is complete (name, role, skills, goals and offers or needs)."
                            />
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {received.map((row) => (
                                    <PersonRow
                                        key={row.record.id}
                                        row={row}
                                        onOpen={() => setSelected(row.person)}
                                        meta={`${row.record.simulated ? 'Simulated request' : 'Request'} · ${when(row.record.createdAt)}`}
                                        actions={
                                            <>
                                                <Button variant="outline" size="sm" className="rounded-lg border-border" onClick={() => respond(row, false)}>
                                                    <X className="h-4 w-4" /> Decline
                                                </Button>
                                                <Button size="sm" className="rounded-lg" onClick={() => respond(row, true)}>
                                                    <Check className="h-4 w-4" /> Accept
                                                </Button>
                                            </>
                                        }
                                    />
                                ))}
                            </ul>
                        )}
                    </TabsContent>

                    <TabsContent value="sent" className="mt-0">
                        {sent.length === 0 ? (
                            <EmptyState
                                icon={Send}
                                title="No requests sent"
                                description="Send requests from Smart Matchmaking or Discover People."
                                action={
                                    <Button asChild size="sm" className="rounded-lg">
                                        <Link to="/matchmaking">See your matches</Link>
                                    </Button>
                                }
                            />
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {sent.map((row) => (
                                    <PersonRow
                                        key={row.record.id}
                                        row={row}
                                        onOpen={() => setSelected(row.person)}
                                        meta={`Sent ${when(row.record.createdAt)}`}
                                        actions={<StatusPill variant="warning" dot>Pending</StatusPill>}
                                    />
                                ))}
                            </ul>
                        )}
                    </TabsContent>

                    <TabsContent value="connected" className="mt-0">
                        {connected.length === 0 ? (
                            <EmptyState
                                icon={Handshake}
                                title="No connections yet"
                                description="Accepted requests appear here."
                                action={
                                    <Button asChild size="sm" className="rounded-lg">
                                        <Link to="/discover">Discover people</Link>
                                    </Button>
                                }
                            />
                        ) : (
                            <ul className="flex flex-col gap-3">
                                {connected.map((row) => (
                                    <PersonRow
                                        key={row.record.id}
                                        row={row}
                                        onOpen={() => setSelected(row.person)}
                                        meta={`Connected ${when(row.record.updatedAt)}`}
                                        actions={
                                            <Button variant="outline" size="sm" className="rounded-lg border-border" onClick={() => setSelected(row.person)}>
                                                View profile
                                            </Button>
                                        }
                                    />
                                ))}
                            </ul>
                        )}
                    </TabsContent>
                </Tabs>
            </SurfaceCard>

            <ProfileDetailDialog profile={selected} onOpenChange={(open) => !open && setSelected(null)} />
        </div>
    );
};

export default Connections;
