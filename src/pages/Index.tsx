import { Link } from 'react-router-dom';
import { CalendarClock, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SurfaceCard from '@/components/common/SurfaceCard';
import EmptyState from '@/components/common/EmptyState';
import WelcomeCard from '@/components/overview/WelcomeCard';
import ProfileCompletionCard from '@/components/overview/ProfileCompletionCard';
import NextStepsCard from '@/components/overview/NextStepsCard';
import MatchmakingIntroCard from '@/components/overview/MatchmakingIntroCard';
import WalletStatusCard from '@/components/wallet/WalletStatusCard';
import ConnectionsSummaryCard from '@/components/connections/ConnectionsSummaryCard';
import { useCollaborations } from '@/hooks/useCollaborations';
import { useConnections } from '@/hooks/useConnections';
import { useMeetings } from '@/hooks/useMeetings';
import { findDemoProfile } from '@/lib/connections/store';

/** Overview dashboard. All figures come from real state — empty states until data exists. */
const Index = () => {
    const { collaborations } = useCollaborations();
    const { isLive, profileForOwnerId } = useConnections();
    const { upcomingAccepted } = useMeetings();
    const nextMeetings = upcomingAccepted.slice(0, 3);
    return (
    <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-3">
            <WelcomeCard className="lg:col-span-2" />
            <ProfileCompletionCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <MatchmakingIntroCard className="lg:col-span-2" />
            <WalletStatusCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
            <NextStepsCard className="lg:row-span-2" />
            <ConnectionsSummaryCard />
            <SurfaceCard title="Upcoming meeting" description="Your next scheduled meeting.">
                {nextMeetings.length === 0 ? (
                    <EmptyState
                        compact
                        icon={CalendarClock}
                        title="Nothing scheduled"
                        description="Meetings you book with other attendees will show here."
                    />
                ) : (
                    <div className="flex flex-col gap-3">
                        <ul className="flex flex-col gap-2">
                            {nextMeetings.map((m) => {
                                const person = isLive
                                    ? profileForOwnerId(m.counterpartId)
                                    : findDemoProfile(m.counterpartId);
                                return (
                                    <li key={m.id} className="text-sm">
                                        <span className="font-medium">
                                            {new Date(m.startTime).toLocaleString(undefined, {
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}
                                        </span>
                                        {person && <span> with {person.fullName}</span>}
                                        <span className="text-muted-foreground"> · {m.location}</span>
                                    </li>
                                );
                            })}
                        </ul>
                        <Button asChild variant="outline" size="sm" className="self-start rounded-lg border-border">
                            <Link to="/meetings">View all meetings</Link>
                        </Button>
                    </div>
                )}
            </SurfaceCard>
            <SurfaceCard
                title="Collaboration"
                description={
                    collaborations.length
                        ? `${collaborations.length} active collaboration${collaborations.length === 1 ? '' : 's'}`
                        : 'Projects and shared spaces.'
                }
                className="lg:col-span-2"
            >
                {collaborations.length === 0 ? (
                    <EmptyState
                        compact
                        icon={Layers}
                        title="No collaborations yet"
                        description="Start or join a collaboration to keep building after the event."
                        action={
                            <Button asChild variant="outline" size="sm" className="rounded-lg border-border">
                                <Link to="/collaboration">Open Collaboration Hub</Link>
                            </Button>
                        }
                    />
                ) : (
                    <div className="flex flex-col gap-3">
                        <ul className="flex flex-col gap-1">
                            {collaborations.slice(0, 3).map((c) => (
                                <li key={c.id} className="text-sm">
                                    <span className="font-medium">{c.name}</span>
                                    {c.description && <span className="text-muted-foreground"> — {c.description}</span>}
                                </li>
                            ))}
                        </ul>
                        <Button asChild variant="outline" size="sm" className="self-start rounded-lg border-border">
                            <Link to="/collaboration">Open Collaboration Hub</Link>
                        </Button>
                    </div>
                )}
            </SurfaceCard>
        </div>
    </div>
    );
};

export default Index;
