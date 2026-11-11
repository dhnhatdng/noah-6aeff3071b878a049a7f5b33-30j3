import { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Check, ExternalLink, MapPin, Mic, QrCode, Radio, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import StatusPill from '@/components/common/StatusPill';
import { toast } from '@/hooks/use-toast';
import { DEMO_PROFILES } from '@/lib/profile/demoProfiles';
import { readLiveEvent, writeLiveEvent, type LiveEventState } from '@/lib/liveEvent/store';
import { getAnonUserId, isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import { useWalletConnect } from '@/hooks/useWalletConnect';

/**
 * VERIFIED BREAKPOINT 2026 FACTS — use only these; do not invent dates,
 * speakers, venues or session times. Verified 2026-11-11 from the
 * official site (solana.com/breakpoint) and Breakpoint announcements:
 * Solana Breakpoint 2026, November 15–17, 2026, Olympia London
 * (Olympia Convention Centre, Hammersmith Road, London W14 8UX), theme
 * "Token Supercycle", 8,000+ attendees from 100+ countries. Confirmed
 * speakers named here are Anatoly Yakovenko and Lily Liu only. Day 1 /
 * Day 2 themes are the program overview as reported; the full schedule —
 * session times, speakers and venues — lives on the official site.
 */
const EVENT = {
    name: 'Solana Breakpoint 2026',
    dates: 'November 15–17, 2026',
    startDate: '2026-11-15T00:00:00Z',
    venue: 'Olympia London',
    address: 'Olympia Convention Centre, Hammersmith Road, London W14 8UX',
    theme: 'Token Supercycle',
    attendance: '8,000+ attendees from 100+ countries',
    site: 'https://solana.com/breakpoint',
    speakers: ['Anatoly Yakovenko', 'Lily Liu'],
} as const;

/** The two verified program-theme rows (same as supabase/migrations/0001_init.sql). */
const VERIFIED_PROGRAM = [
    { day: 1, title: 'The Supercycle Today', theme: 'Stablecoins and payments', description: null as string | null },
    { day: 2, title: 'AI agents and consumer apps', theme: 'AI agents and consumer apps', description: null as string | null },
];

interface ProgramSession {
    day: number;
    title: string;
    theme: string | null;
    description: string | null;
}

/**
 * DEMO AGENDA — sample sessions only, shown in demo mode only. No real
 * Breakpoint dates, speakers or venues are claimed here.
 */
const DEMO_AGENDA = [
    { title: 'Opening', description: 'Welcome and orientation for attendees.' },
    { title: 'Matchmaking mixer', description: 'Meet your top Smart Matchmaking suggestions in person.' },
    { title: 'Builder workshop', description: 'Hands-on session for builders — bring your project.' },
    { title: 'Demo day', description: 'Teams show what they built and take questions.' },
];

/** Live mode when Supabase is configured; localStorage demo otherwise. */
const SUPABASE_MODE = isSupabaseConfigured();

const LiveEvent = () => {
    const { address: walletAddress } = useWalletConnect();
    const [state, setState] = useState<LiveEventState>(() => readLiveEvent());

    // ── Supabase mode state ──────────────────────────────────────────────
    const [ownerId, setOwnerId] = useState<string | null>(null);
    const [liveCheckedIn, setLiveCheckedIn] = useState<boolean | null>(null);
    const [liveCheckedInAt, setLiveCheckedInAt] = useState<string | null>(null);
    const [liveCount, setLiveCount] = useState<number | null>(null);
    const [liveBusy, setLiveBusy] = useState(false);
    const [program, setProgram] = useState<ProgramSession[]>(VERIFIED_PROGRAM);
    const [programSource, setProgramSource] = useState<'supabase' | 'verified'>('verified');
    const ownerRef = useRef<string | null>(null);

    const refreshLiveCount = useCallback(async () => {
        if (!supabase) return;
        const { count, error } = await supabase.from('event_checkins').select('*', { count: 'exact', head: true });
        if (error) {
            console.warn('[live-event] Could not count check-ins', error.message);
            return;
        }
        setLiveCount(count ?? 0);
    }, []);

    const refreshMyCheckIn = useCallback(async () => {
        const owner = ownerRef.current;
        if (!supabase || !owner) return;
        const { data, error } = await supabase
            .from('event_checkins')
            .select('checked_in_at')
            .eq('user_id', owner)
            .maybeSingle();
        if (error) {
            console.warn('[live-event] Could not read check-in', error.message);
            return;
        }
        setLiveCheckedIn(data !== null);
        setLiveCheckedInAt(data?.checked_in_at ?? null);
    }, []);

    // Resolve the anonymous Supabase identity (no-op in demo mode).
    useEffect(() => {
        if (!SUPABASE_MODE) return;
        let active = true;
        getAnonUserId().then((id) => {
            if (!active) return;
            ownerRef.current = id;
            setOwnerId(id);
        });
        return () => {
            active = false;
        };
    }, []);

    // Load the program overview from event_sessions when configured; the
    // two verified theme rows above are the fallback.
    useEffect(() => {
        if (!SUPABASE_MODE || !supabase) return;
        let active = true;
        supabase
            .from('event_sessions')
            .select('day,title,theme,description')
            .order('day', { ascending: true })
            .then(({ data, error }) => {
                if (!active) return;
                if (error || !data || data.length === 0) {
                    if (error) console.warn('[live-event] Could not load program', error.message);
                    return;
                }
                setProgram(
                    (data as ProgramSession[]).map((row) => ({
                        day: row.day,
                        title: row.title,
                        theme: row.theme,
                        description: row.description,
                    })),
                );
                setProgramSource('supabase');
            });
        return () => {
            active = false;
        };
    }, []);

    // Load my check-in + the real check-in count, and refresh the count live.
    useEffect(() => {
        if (!SUPABASE_MODE || !ownerId || !supabase) return;
        void refreshMyCheckIn();
        void refreshLiveCount();
        const channel = supabase
            .channel('event-checkins-live')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'event_checkins' }, () => {
                void refreshLiveCount();
            })
            .subscribe();
        return () => {
            void supabase.removeChannel(channel);
        };
    }, [ownerId, refreshMyCheckIn, refreshLiveCount]);

    // Demo mode: keep multiple tabs in sync via the `storage` event.
    useEffect(() => {
        if (SUPABASE_MODE) return;
        const onStorage = (event: StorageEvent) => {
            if (event.key !== 'bc:v1:live-event') return;
            setState(readLiveEvent());
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const toggleCheckIn = async () => {
        if (SUPABASE_MODE) {
            const owner = ownerRef.current;
            if (!supabase || !owner) {
                toast({
                    title: 'Check-in unavailable',
                    description: 'Supabase is still connecting. Try again in a moment.',
                    variant: 'destructive',
                });
                return;
            }
            setLiveBusy(true);
            try {
                if (liveCheckedIn) {
                    const { error } = await supabase.from('event_checkins').delete().eq('user_id', owner);
                    if (error) throw new Error(error.message);
                    setLiveCheckedIn(false);
                    setLiveCheckedInAt(null);
                    toast({ title: 'Check-in removed', description: 'You are no longer checked in.' });
                } else {
                    const { error } = await supabase
                        .from('event_checkins')
                        .insert({ user_id: owner, wallet_address: walletAddress ?? null });
                    if (error) {
                        if (error.code === '23505') {
                            setLiveCheckedIn(true);
                            toast({ title: 'Already checked in', description: 'Your check-in is already recorded.' });
                        } else {
                            throw new Error(error.message);
                        }
                    } else {
                        setLiveCheckedIn(true);
                        setLiveCheckedInAt(new Date().toISOString());
                        toast({
                            title: 'Checked in',
                            description: 'Your check-in is saved to Supabase and counted below.',
                        });
                    }
                }
                await refreshLiveCount();
            } catch (err) {
                toast({
                    title: 'Check-in failed',
                    description: err instanceof Error ? err.message : 'Something went wrong.',
                    variant: 'destructive',
                });
            } finally {
                setLiveBusy(false);
            }
            return;
        }
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

    const checkedIn = SUPABASE_MODE ? (liveCheckedIn ?? false) : state.checkedIn;
    const checkedInAt = SUPABASE_MODE ? liveCheckedInAt : state.checkedInAt;
    // Demo mode: the 30 fictional demo profiles, plus you once checked in.
    const demoAttendeeCount = DEMO_PROFILES.length + (state.checkedIn ? 1 : 0);

    const daysUntil = Math.ceil((Date.parse(EVENT.startDate) - Date.now()) / 86_400_000);
    const countdown =
        daysUntil > 0 ? `Starts in ${daysUntil} day${daysUntil === 1 ? '' : 's'}` : daysUntil === 0 ? 'Starts today' : 'Happening now';

    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                eyebrow="Live Event"
                title="Breakpoint 2026"
                description="Solana Breakpoint 2026 — November 15–17, Olympia London. Check in, see who's here through Breakpoint Connect, and read the verified program overview."
            />

            <SurfaceCard title="Solana Breakpoint 2026">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-3">
                        <p className="flex items-center gap-2 text-sm">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
                            <span>
                                <span className="font-medium">{EVENT.dates}</span>
                                <span className="text-muted-foreground"> · {countdown}</span>
                            </span>
                        </p>
                        <p className="flex items-start gap-2 text-sm">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                            <span>
                                <span className="font-medium">{EVENT.venue}</span>
                                <span className="block text-muted-foreground">{EVENT.address}</span>
                            </span>
                        </p>
                        <p className="flex items-center gap-2 text-sm">
                            <UsersRound className="h-4 w-4 text-muted-foreground" aria-hidden />
                            {EVENT.attendance}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <p className="text-sm">
                            Theme: <span className="font-medium">“{EVENT.theme}”</span>
                        </p>
                        <p className="flex items-start gap-2 text-sm">
                            <Mic className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                            <span>
                                Confirmed speakers include{' '}
                                <span className="font-medium">{EVENT.speakers.join(' and ')}</span>
                            </span>
                        </p>
                        <p>
                            <Button asChild variant="outline" size="sm" className="rounded-lg border-border">
                                <a href={EVENT.site} target="_blank" rel="noreferrer">
                                    Official site — solana.com/breakpoint <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                </a>
                            </Button>
                        </p>
                    </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                    The full schedule — session times, speakers and venues — is on the official site. Only the facts
                    above are shown here; nothing else about the program is claimed.
                </p>
            </SurfaceCard>

            <div className="grid gap-6 lg:grid-cols-3">
                <SurfaceCard
                    title="Happening now"
                    action={<StatusPill dot>{checkedIn ? 'Checked in' : 'Not live'}</StatusPill>}
                    className="lg:col-span-2"
                >
                    {checkedIn ? (
                        <div className="flex flex-col gap-3">
                            <p className="flex items-center gap-2 font-medium">
                                <Check className="h-5 w-5 text-success" aria-hidden /> You’re checked in
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Checked in{' '}
                                {checkedInAt &&
                                    new Date(checkedInAt).toLocaleString(undefined, {
                                        dateStyle: 'medium',
                                        timeStyle: 'short',
                                    })}
                                {SUPABASE_MODE
                                    ? '. Recorded in Supabase (event_checkins).'
                                    : '. This is stored in this browser only.'}
                            </p>
                            <p className="flex items-center gap-2 text-sm">
                                <UsersRound className="h-4 w-4 text-muted-foreground" aria-hidden />
                                {SUPABASE_MODE
                                    ? `${liveCount ?? '…'} checked in through Breakpoint Connect`
                                    : `${demoAttendeeCount} attending — ${DEMO_PROFILES.length} demo profiles + you`}
                            </p>
                        </div>
                    ) : (
                        <EmptyState
                            icon={Radio}
                            title="No live sessions"
                            description={
                                SUPABASE_MODE
                                    ? `Live sessions and announcements will appear here during the event. ${countdown} — check in below to be counted.`
                                    : `Live sessions and announcements will appear here during the event. ${countdown} — check in below to join the demo attendee count.`
                            }
                        />
                    )}
                </SurfaceCard>
                <SurfaceCard title="Check-in">
                    <div className="flex flex-col items-start gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary-strong">
                            <QrCode className="h-5 w-5" aria-hidden />
                        </span>
                        <p className="font-medium">{checkedIn ? 'You’re checked in' : 'Check in to the event'}</p>
                        <p className="text-sm text-muted-foreground">
                            {checkedIn
                                ? `Checked in ${checkedInAt ? new Date(checkedInAt).toLocaleTimeString(undefined, { timeStyle: 'short' }) : ''}. Tap below to undo it.`
                                : SUPABASE_MODE
                                  ? 'Saves your check-in to Supabase with your connected wallet address, if any.'
                                  : 'Demo check-in only — saved in this browser, not sent to any event system.'}
                        </p>
                        <p className="flex items-center gap-2 text-sm">
                            <UsersRound className="h-4 w-4 text-muted-foreground" aria-hidden />
                            {SUPABASE_MODE
                                ? `${liveCount ?? '…'} checked in through Breakpoint Connect`
                                : `${demoAttendeeCount} attending — ${DEMO_PROFILES.length} demo profiles${state.checkedIn ? ' + you' : ' (check in to add yourself)'}`}
                        </p>
                        <Button className="rounded-xl" onClick={toggleCheckIn} disabled={liveBusy}>
                            {checkedIn ? 'Undo check-in' : 'Check in'}
                        </Button>
                    </div>
                </SurfaceCard>
            </div>

            <SurfaceCard
                title="Program overview"
                description={
                    programSource === 'supabase'
                        ? 'Program themes from Supabase (event_sessions). No session times are published here — see the official site for the full schedule.'
                        : 'Verified program themes. No session times are published here — see the official site for the full schedule.'
                }
            >
                <ol className="grid gap-4 sm:grid-cols-2">
                    {program.map((session) => (
                        <li key={`${session.day}-${session.title}`} className="rounded-xl border border-border bg-background p-4">
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-4 w-4" aria-hidden /> Day {session.day}
                            </p>
                            <p className="mt-2 font-medium">{session.title}</p>
                            {session.theme && session.theme !== session.title && (
                                <p className="mt-1 text-sm text-muted-foreground">{session.theme}</p>
                            )}
                            {session.description && <p className="mt-1 text-sm text-muted-foreground">{session.description}</p>}
                        </li>
                    ))}
                </ol>
                <p className="mt-4 text-xs text-muted-foreground">
                    The Nitro 05 “Build for Breakpoint” hackathon runs alongside the event — check the Noah AI app or
                    @TryNoahAI for its current status; no hackathon deadline is claimed here.
                </p>
            </SurfaceCard>

            {!SUPABASE_MODE && (
                <SurfaceCard
                    title="Demo agenda — sample sessions"
                    description="A placeholder agenda. No real dates, speakers or venues — the real schedule is not connected."
                >
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
            )}
        </div>
    );
};

export default LiveEvent;
