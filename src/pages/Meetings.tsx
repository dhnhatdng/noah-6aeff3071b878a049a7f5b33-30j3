import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Check, Handshake, UserRoundPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import StatusPill from '@/components/common/StatusPill';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import DemoUserBadge from '@/components/profile/DemoUserBadge';
import { useConnections } from '@/hooks/useConnections';
import { useMeetings } from '@/hooks/useMeetings';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';
import { findDemoProfile } from '@/lib/connections/store';
import type { MeetingRecord } from '@/lib/meetings/store';
import type { DemoProfile, UserProfile } from '@/lib/profile/types';

const when = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

const statusPill = (status: MeetingRecord['status']) =>
    status === 'accepted' ? (
        <StatusPill variant="success" dot>Accepted</StatusPill>
    ) : status === 'declined' ? (
        <StatusPill variant="danger">Declined</StatusPill>
    ) : (
        <StatusPill variant="warning" dot>Pending</StatusPill>
    );

const Meetings = () => {
    const { profile, status } = useProfile();
    const { isLive, profileForOwnerId } = useConnections();
    const { meetings, acceptMeeting, declineMeeting } = useMeetings();

    // Resolve each counterpart for display. Live: auth user id -> profile.
    // Demo: profile id -> demo profile.
    const resolve = (counterpartId: string): DemoProfile | UserProfile | undefined =>
        isLive ? profileForOwnerId(counterpartId) : findDemoProfile(counterpartId);

    const { upcoming, past } = useMemo(() => {
        const now = new Date().toISOString();
        const sorted = [...meetings].sort((a, b) => a.startTime.localeCompare(b.startTime));
        return {
            upcoming: sorted.filter((m) => m.startTime >= now && m.status !== 'declined'),
            past: sorted.filter((m) => m.startTime < now || m.status === 'declined'),
        };
    }, [meetings]);

    const respond = async (meeting: MeetingRecord, accept: boolean) => {
        try {
            if (accept) await acceptMeeting(meeting.id);
            else await declineMeeting(meeting.id);
            toast({ title: accept ? 'Meeting accepted' : 'Meeting declined' });
        } catch (err) {
            toast({
                title: 'Action failed',
                description: err instanceof Error ? err.message : 'Something went wrong.',
                variant: 'destructive',
            });
        }
    };

    const renderRow = (meeting: MeetingRecord) => {
        const person = resolve(meeting.counterpartId);
        const name = person?.fullName ?? 'Unknown attendee';
        const canRespond = meeting.status === 'pending' && meeting.direction === 'received';
        return (
            <li key={meeting.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center">
                <ProfileAvatar name={name} photoUrl={person?.photoUrl ?? null} size="sm" />
                <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                        {name}
                        {person?.kind === 'demo' && <DemoUserBadge />}
                        {statusPill(meeting.status)}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {when(meeting.startTime)} · {meeting.location}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {meeting.direction === 'sent' ? 'You proposed this meeting' : `${name.split(' ')[0]} proposed this meeting`}
                    </p>
                </div>
                {canRespond && (
                    <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" className="rounded-lg border-border" onClick={() => void respond(meeting, false)}>
                            <X className="h-4 w-4" /> Decline
                        </Button>
                        <Button size="sm" className="rounded-lg" onClick={() => void respond(meeting, true)}>
                            <Check className="h-4 w-4" /> Accept
                        </Button>
                    </div>
                )}
            </li>
        );
    };

    const header = (
        <PageHeader
            eyebrow="Meetings"
            title="Your meetings"
            description="Meetings you proposed or were invited to during Breakpoint, Nov 15–17, 2026."
            actions={
                isLive ? (
                    <StatusPill variant="success" dot className="h-9 px-3">LIVE MEETINGS</StatusPill>
                ) : (
                    <StatusPill variant="warning" className="h-9 px-3">DEMO MEETINGS</StatusPill>
                )
            }
        />
    );

    if (status === 'loading') {
        return (
            <div className="flex flex-col gap-8">
                {header}
                <SurfaceCard title="Upcoming">
                    <EmptyState compact icon={CalendarClock} title="Loading…" description=" " />
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
                        title="Create your profile to book meetings"
                        description="Meetings are linked to your profile."
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

            <SurfaceCard title="Upcoming">
                {upcoming.length === 0 ? (
                    <EmptyState
                        compact
                        icon={CalendarClock}
                        title="Nothing scheduled"
                        description="Propose a meeting from a connection or a conversation — meetings can only be booked Nov 15–17, 2026."
                        action={
                            <Button asChild size="sm" className="rounded-lg">
                                <Link to="/connections">Go to Connections</Link>
                            </Button>
                        }
                    />
                ) : (
                    <ul className="flex flex-col gap-3">{upcoming.map(renderRow)}</ul>
                )}
            </SurfaceCard>

            <SurfaceCard title="Past & declined">
                {past.length === 0 ? (
                    <EmptyState
                        compact
                        icon={Handshake}
                        title="Nothing here yet"
                        description="Past and declined meetings will show here."
                    />
                ) : (
                    <ul className="flex flex-col gap-3">{past.map(renderRow)}</ul>
                )}
            </SurfaceCard>
        </div>
    );
};

export default Meetings;
