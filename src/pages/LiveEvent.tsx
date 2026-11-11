import { useEffect, useState } from 'react';
import { CalendarDays, Check, QrCode, Radio, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import StatusPill from '@/components/common/StatusPill';
import { toast } from '@/hooks/use-toast';
import { DEMO_PROFILES } from '@/lib/profile/demoProfiles';
import { readLiveEvent, writeLiveEvent, type LiveEventState } from '@/lib/liveEvent/store';

/**
 * DEMO AGENDA — sample sessions only. No real Breakpoint dates, speakers
 * or venues are claimed here; the agenda is a placeholder for the real
 * schedule, which is not connected.
 */
const DEMO_AGENDA = [
    { title: 'Opening', description: 'Welcome and orientation for attendees.' },
    { title: 'Matchmaking mixer', description: 'Meet your top Smart Matchmaking suggestions in person.' },
    { title: 'Builder workshop', description: 'Hands-on session for builders — bring your project.' },
    { title: 'Demo day', description: 'Teams show what they built and take questions.' },
];

const LiveEvent = () => {
    const [state, setState] = useState<LiveEventState>(() => readLiveEvent());

    useEffect(() => {
        const onStorage = (event: StorageEvent) => {
            if (event.key !== 'bc:v1:live-event') return;
            setState(readLiveEvent());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const toggleCheckIn = () => {
        try {
            const next: LiveEventState = state.checkedIn
                ? { version: 1, checkedIn: false, checkedInAt: null }
                : { version: 1, checkedIn: true, checkedInAt: new Date().toISOString() };
            writeLiveEvent(next);
            setState(next);
            toast({
                title: next.checkedIn ? 'Checked in' : 'Check-in removed',
                description: next.checkedIn
                    ? 'Your check-in is saved in this browser only — no real event system was notified.'
                    : 'You are no longer checked in.',
            });
        } catch (err) {
            toast({
                title: 'Check-in failed',
                description: err instanceof Error ? err.message : 'Something went wrong.',
                variant: 'destructive',
            });
        }
    };

    // Attendees are the 30 fictional demo profiles, plus you once checked in.
    const attendeeCount = DEMO_PROFILES.length + (state.checkedIn ? 1 : 0);

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                eyebrow="Live Event"
                title="On the ground"
                description="Schedule, what’s happening now and event check-in — all in one place. Check-in and the agenda below are a local demo; no real event data is connected."
            />

            <div className="grid gap-6 lg:grid-cols-3">
                <SurfaceCard
                    title="Happening now"
                    action={<StatusPill dot>{state.checkedIn ? 'Checked in' : 'Not live'}</StatusPill>}
                    className="lg:col-span-2"
                >
                    {state.checkedIn ? (
                        <div className="flex flex-col gap-3">
                            <p className="flex items-center gap-2 font-medium">
                                <Check className="h-5 w-5 text-success" aria-hidden /> You’re checked in
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Checked in{' '}
                                {state.checkedInAt &&
                                    new Date(state.checkedInAt).toLocaleString(undefined, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    })}
                                . This is stored in this browser only.
                            </p>
                            <p className="flex items-center gap-2 text-sm">
                                <UsersRound className="h-4 w-4 text-muted-foreground" aria-hidden />
                                {attendeeCount} attending — {DEMO_PROFILES.length} demo profiles + you
                            </p>
                        </div>
                    ) : (
                        <EmptyState
                            icon={Radio}
                            title="No live sessions"
                            description="Live sessions and announcements will appear here during the event. Check in below to join the demo attendee count."
                        />
                    )}
                </SurfaceCard>
                <SurfaceCard title="Check-in">
                    <div className="flex flex-col items-start gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary-strong">
                            <QrCode className="h-5 w-5" aria-hidden />
                        </span>
                        <p className="font-medium">{state.checkedIn ? 'You’re checked in' : 'Check in to the event'}</p>
                        <p className="text-sm text-muted-foreground">
                            {state.checkedIn
                                ? `Checked in ${state.checkedInAt ? new Date(state.checkedInAt).toLocaleTimeString(undefined, { timeStyle: 'short' }) : ''}. Tap below to undo it.`
                                : 'Demo check-in only — saved in this browser, not sent to any event system.'}
                        </p>
                        <p className="flex items-center gap-2 text-sm">
                            <UsersRound className="h-4 w-4 text-muted-foreground" aria-hidden />
                            {attendeeCount} attending — {DEMO_PROFILES.length} demo profiles
                            {state.checkedIn ? ' + you' : ' (check in to add yourself)'}
                        </p>
                        <Button className="rounded-xl" onClick={toggleCheckIn}>
                            {state.checkedIn ? 'Undo check-in' : 'Check in'}
                        </Button>
                    </div>
                </SurfaceCard>
            </div>

            <SurfaceCard title="Demo agenda — sample sessions" description="A placeholder agenda. No real dates, speakers or venues — the real schedule is not connected.">
                <ol className="grid gap-4 sm:grid-cols-2">
                    {DEMO_AGENDA.map((session, i) => (
                        <li key={session.title} className="rounded-xl border border-border bg-background p-4">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" aria-hidden /> Session {i + 1}
                            </p>
                            <p className="mt-2 font-medium">{session.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{session.description}</p>
                        </li>
                    ))}
                </ol>
            </SurfaceCard>
        </div>
    );
};

export default LiveEvent;
