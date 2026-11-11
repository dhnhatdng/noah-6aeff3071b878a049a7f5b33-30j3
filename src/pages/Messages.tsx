import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Info, MessageSquare, Send, UserRoundPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/common/PageHeader';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import StatusPill from '@/components/common/StatusPill';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import DemoUserBadge from '@/components/profile/DemoUserBadge';
import MeetingForm from '@/components/meetings/MeetingForm';
import { useConnections } from '@/hooks/useConnections';
import { useMessages } from '@/hooks/useMessages';
import { useMeetings } from '@/hooks/useMeetings';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';
import { findDemoProfile } from '@/lib/connections/store';
import type { DemoProfile, UserProfile } from '@/lib/profile/types';
import { cn } from '@/lib/utils';

interface Conversation {
    counterpartId: string;
    person: DemoProfile | UserProfile;
}

const Messages = () => {
    const { profile, status } = useProfile();
    const { records, isLive, profileForOwnerId } = useConnections();
    const { myId, thread, loadThread, sendTo } = useMessages();
    const { proposeMeeting } = useMeetings();
    const [searchParams] = useSearchParams();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [meetingOpen, setMeetingOpen] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Only accepted connections can be messaged. In live mode the record's
    // counterpart id is an auth user id; in demo mode it is a demo profile id.
    const conversations = useMemo<Conversation[]>(
        () =>
            records
                .filter((r) => r.status === 'accepted')
                .flatMap((r) => {
                    const person = isLive ? profileForOwnerId(r.counterpartId) : findDemoProfile(r.counterpartId);
                    return person ? [{ counterpartId: r.counterpartId, person }] : [];
                })
                .sort((a, b) => a.person.fullName.localeCompare(b.person.fullName)),
        [records, isLive, profileForOwnerId],
    );

    // Deep-link: /messages?with=<counterpartId> preselects a conversation.
    useEffect(() => {
        const withId = searchParams.get('with');
        if (withId && conversations.some((c) => c.counterpartId === withId)) {
            setSelectedId(withId);
        }
    }, [searchParams, conversations]);

    const selected = conversations.find((c) => c.counterpartId === selectedId) ?? null;
    const isDemoPerson = selected?.person.kind === 'demo';

    useEffect(() => {
        if (selectedId) void loadThread(selectedId);
    }, [selectedId, loadThread]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [thread, selectedId]);

    const send = async () => {
        if (!selected || !draft.trim() || sending) return;
        setSending(true);
        try {
            await sendTo(selected.counterpartId, draft);
            setDraft('');
        } catch (err) {
            toast({
                title: 'Message not sent',
                description: err instanceof Error ? err.message : 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setSending(false);
        }
    };

    const header = (
        <PageHeader
            eyebrow="Messages"
            title="Conversations"
            description="Direct messages with people you’re connected to."
            actions={
                isLive ? (
                    <StatusPill variant="success" dot className="h-9 px-3">LIVE MESSAGING</StatusPill>
                ) : (
                    <StatusPill variant="warning" className="h-9 px-3">DEMO MESSAGING</StatusPill>
                )
            }
        />
    );

    if (status === 'loading') {
        return (
            <div className="flex flex-col gap-8">
                {header}
                <SurfaceCard>
                    <EmptyState compact icon={MessageSquare} title="Loading…" description=" " />
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
                        title="Create your profile to start messaging"
                        description="Messages are linked to your profile."
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
        <div className="flex flex-col gap-6">
            {header}

            <div role="note" className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                    {isLive ? (
                        <>
                            <strong className="font-semibold">LIVE MESSAGING.</strong> Messages are sent in real time
                            and only visible to you and the other person.
                        </>
                    ) : (
                        <>
                            <strong className="font-semibold">DEMO MESSAGING.</strong> Every connection here is a fictional
                            DEMO USER, so they can’t receive or reply to messages. Sending is disabled — connect with a
                            real attendee (Supabase) to start messaging.
                        </>
                    )}
                </p>
            </div>

            {conversations.length === 0 ? (
                <SurfaceCard>
                    <EmptyState
                        icon={MessageSquare}
                        title="No conversations yet"
                        description="Accept a connection request to start messaging someone."
                        action={
                            <Button asChild size="sm" className="rounded-lg">
                                <Link to="/connections">Go to Connections</Link>
                            </Button>
                        }
                    />
                </SurfaceCard>
            ) : (
                <div className="grid gap-4 md:grid-cols-[300px_1fr]">
                    {/* Conversation list */}
                    <SurfaceCard
                        title="Connections"
                        className={cn(selected && 'hidden md:block')}
                    >
                        <ul className="flex flex-col gap-1">
                            {conversations.map((c) => {
                                const active = c.counterpartId === selectedId;
                                return (
                                    <li key={c.counterpartId}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(c.counterpartId)}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors',
                                                active ? 'bg-primary-soft' : 'hover:bg-secondary',
                                            )}
                                            aria-current={active}
                                        >
                                            <ProfileAvatar name={c.person.fullName} photoUrl={c.person.photoUrl} size="sm" />
                                            <span className="min-w-0">
                                                <span className="flex items-center gap-2">
                                                    <span className="truncate font-medium">{c.person.fullName}</span>
                                                    {c.person.kind === 'demo' && <DemoUserBadge />}
                                                </span>
                                                <span className="block truncate text-sm text-muted-foreground">
                                                    {c.person.role} · {c.person.organization}
                                                </span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </SurfaceCard>

                    {/* Thread */}
                    <SurfaceCard className={cn(!selected && 'hidden md:block')}>
                        {!selected ? (
                            <EmptyState
                                compact
                                icon={MessageSquare}
                                title="Pick a conversation"
                                description="Choose someone from the list to open your thread with them."
                            />
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-lg md:hidden"
                                        onClick={() => setSelectedId(null)}
                                    >
                                        <ArrowLeft className="h-4 w-4" /> Back
                                    </Button>
                                    <ProfileAvatar name={selected.person.fullName} photoUrl={selected.person.photoUrl} size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="flex flex-wrap items-center gap-2 font-medium">
                                            {selected.person.fullName}
                                            {isDemoPerson && <DemoUserBadge />}
                                        </p>
                                        <p className="truncate text-sm text-muted-foreground">
                                            {selected.person.role} · {selected.person.organization}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="rounded-lg border-border"
                                        onClick={() => setMeetingOpen(true)}
                                    >
                                        <CalendarClock className="h-4 w-4" /> Propose meeting
                                    </Button>
                                </div>

                                {isDemoPerson && (
                                    <p role="note" className="rounded-xl border border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning">
                                        {selected.person.fullName.split(' ')[0]} is a demo user — demo profiles can’t
                                        receive or reply to messages, so sending is disabled here.
                                    </p>
                                )}

                                <div className="flex max-h-[420px] min-h-[240px] flex-col gap-2 overflow-y-auto pr-1" aria-live="polite">
                                    {thread.length === 0 ? (
                                        <p className="m-auto text-sm text-muted-foreground">
                                            {isDemoPerson
                                                ? 'No messages — demo users can’t reply.'
                                                : 'No messages yet. Say hello!'}
                                        </p>
                                    ) : (
                                        thread.map((m) => {
                                            const mine = m.senderId === myId;
                                            return (
                                                <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                                                    <div
                                                        className={cn(
                                                            'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                                                            mine ? 'bg-primary text-primary-foreground' : 'bg-secondary',
                                                        )}
                                                    >
                                                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                                                        <p className={cn('mt-1 text-[11px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                                            {new Date(m.createdAt).toLocaleString(undefined, {
                                                                dateStyle: 'medium',
                                                                timeStyle: 'short',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                <div className="flex flex-col gap-2 border-t border-border pt-4">
                                    <Textarea
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                void send();
                                            }
                                        }}
                                        placeholder={isDemoPerson ? 'Demo users can’t receive messages' : 'Write a message…'}
                                        disabled={isDemoPerson || sending}
                                        rows={2}
                                        className="rounded-xl border-border"
                                        aria-label="Message"
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            className="rounded-xl"
                                            onClick={() => void send()}
                                            disabled={isDemoPerson || sending || !draft.trim()}
                                        >
                                            <Send className="h-4 w-4" /> Send
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </SurfaceCard>
                </div>
            )}

            {selected && (
                <MeetingForm
                    open={meetingOpen}
                    onOpenChange={setMeetingOpen}
                    counterpartName={selected.person.fullName}
                    onSubmit={(input) => proposeMeeting(selected.counterpartId, input)}
                />
            )}
        </div>
    );
};

export default Messages;
